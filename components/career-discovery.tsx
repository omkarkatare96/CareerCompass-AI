"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Zap,
  Shield,
  Target,
  Users,
  Activity,
} from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
  PolarGrid,
  RadarChart,
  Radar,
  Tooltip,
} from "recharts"
import BlurText from "@/components/BlurText"
import { CareerRoadmap, RoadmapData } from "@/components/career-roadmap"
import { SprintPlanner } from "@/components/sprint-planner"
import { toast } from "sonner"

const questions = [
  {
    id: "pressure_fear",
    text: "When facing a high-stakes component failure or public mistake, what is your immediate visceral reaction?",
    icon: Activity,
    options: [
      { label: "Fear of public visibility / embarrassment", value: "public_visibility" },
      { label: "Anxiety about technical complexity / fixing it", value: "technical_complexity" },
      { label: "Dread of letting down the team / responsibility", value: "responsibility_failure" },
    ],
  },
  {
    id: "life_preference",
    text: "Which lifestyle reality would you honestly choose for the next 10 years?",
    icon: Target,
    options: [
      { label: "High Income + High Stress + No Work-Life Balance", value: "high_income_high_stress" },
      { label: "Average Income + Peaceful 9-5 + Low Stress", value: "stable_peaceful" },
      { label: "Unstable Income + Complete Freedom + Travel", value: "flexible_unstable" },
    ],
  },
  {
    id: "team_role",
    text: "In a chaotic group project, who do you actually become?",
    icon: Users,
    options: [
      { label: "The Leader (Commanding everyone)", value: "leader" },
      { label: "The Strategist (Planning privately)", value: "strategist" },
      { label: "The Executor (Just tell me what to do)", value: "executor" },
    ],
  },
  {
    id: "failure_response",
    text: "What hurts you the most about failing?",
    icon: AlertTriangle,
    options: [
      { label: "People judging me / Social Image", value: "social_judgement" },
      { label: "Disappointing myself / My standards", value: "self_disappointment" },
      { label: "The lost opportunity / Wasted time", value: "lost_opportunity" },
    ],
  },
  {
    id: "energy_drain",
    text: "What exhausts you the fastest?",
    icon: Zap,
    options: [
      { label: "Constant people interaction / Meetings", value: "people_interaction" },
      { label: "Deep, isolated technical thinking", value: "deep_technical_thinking" },
      { label: "Repetitive, boring routine tasks", value: "repetitive_routine" },
    ],
  },
  {
    id: "risk_tolerance",
    text: "Which 'Risk' scares you less?",
    icon: Shield,
    options: [
      { label: "High Competition (Fighting for top spot)", value: "high_competition" },
      { label: "Long-term Study (No money for years)", value: "long_term_study" },
      { label: "Unstable Income (Feast or Famine)", value: "unstable_income" },
    ],
  },
]

export function CareerDiscovery() {
  const [started, setStarted] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [customInput, setCustomInput] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<any>(null)
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null)
  const [loadingRoadmap, setLoadingRoadmap] = useState(false)
  const [selectedStream, setSelectedStream] = useState<string | null>(null)

  const handleCreateRoadmap = async () => {
    if (!aiResult || !selectedStream) return
    setLoadingRoadmap(true)
    try {
      const streamNames = aiResult.suitable_career_streams?.map((s: any) =>
        typeof s === "object" && s !== null ? s.name : s
      )
      const roleNames = aiResult.ideal_career_roles?.map((r: any) =>
        typeof r === "object" && r !== null ? r.role : r
      )
      const response = await fetch("http://localhost:8000/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discover_result: aiResult,
          selected_stream: selectedStream,
          goals: `I want to pursue a career in ${selectedStream}. Other potential streams: ${streamNames?.join(", ")}. Potential roles: ${roleNames?.join(", ")}.`
        })
      })
      if (!response.ok) throw new Error("Failed to generate roadmap")
      const data = await response.json()
      setRoadmapData(data)

      // Save to Firestore (silently skip if not logged in)
      try {
        const user = auth.currentUser
        if (user && data.phases) {
          await addDoc(collection(db, "users", user.uid, "roadmaps"), {
            stream: selectedStream,
            phases: data.phases,
            source: "discover",
            generatedAt: serverTimestamp(),
          })
        }
      } catch (saveErr) {
        console.warn("Roadmap save skipped:", saveErr)
      }

      setTimeout(() => {
        document.getElementById("generated-roadmap")?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      toast.error("Failed to generate roadmap")
      console.error(error)
    } finally {
      setLoadingRoadmap(false)
    }
  }

  const progress = ((currentQ + 1) / questions.length) * 100

  function selectAnswer(answerValue: string) {
    setAnswers((prev) => ({
      ...prev,
      [currentQ]: answerValue,
    }))
  }

  async function nextQuestion() {
    let finalAnswerForStep = answers[currentQ]

    if (customInput && customInput.trim() !== "") {
      finalAnswerForStep = customInput.trim()
      setAnswers((prev) => ({
        ...prev,
        [currentQ]: customInput.trim(),
      }))
      setCustomInput("")
    }

    if (!finalAnswerForStep) {
      console.log("No answer selected for question:", currentQ)
      return
    }

    const updatedAnswers = {
      ...answers,
      [currentQ]: finalAnswerForStep,
    }

    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1)
    } else {
      console.log("Submitting answers:", updatedAnswers)
      submitDiscover(updatedAnswers)
    }
  }

  async function submitDiscover(finalAnswers: Record<number, string>) {
    setLoading(true)
    setError(null)

    try {
      if (!finalAnswers) {
        console.error("No answers provided")
        return
      }

      const formattedDiscoverData: Record<string, any> = {
        pressure_fear: finalAnswers[0] || "",
        life_preference: finalAnswers[1] || "",
        team_role: finalAnswers[2] || "",
        failure_response: finalAnswers[3] || "",
        energy_drain: finalAnswers[4] || "",
        risk_tolerance: finalAnswers[5] || "",
        custom_inputs: {}
      }

      questions.forEach((q, index) => {
        const ans = finalAnswers[index]
        const isPredefined = q.options.some((opt) => opt.value === ans)
        if (!isPredefined && ans) {
          formattedDiscoverData.custom_inputs[q.id] = ans
        }
      })

      console.log("Sending data:", formattedDiscoverData)

      const response = await fetch("http://127.0.0.1:8000/generate-discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedDiscoverData),
      })

      console.log("Response received:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server Error:", errorText)
        let errorMsg = "Server error"
        try {
          const errorJson = JSON.parse(errorText)
          errorMsg = errorJson.detail || errorText
        } catch (e) {
          errorMsg = errorText
        }
        throw new Error(errorMsg)
      }

      const result = await response.json()
      console.log("AI RESULT FULL OBJECT:", result)
      setAiResult(result)

      if (auth.currentUser) {
        const userId = auth.currentUser.uid
        await setDoc(doc(db, "users", userId, "discover", "latest"), {
          result,
          timestamp: serverTimestamp(),
          answers: finalAnswers,
        })
      }

      setShowResults(true)

    } catch (err) {
      console.error("Fetch Error:", err)
      const errorMessage = "Unable to connect to backend. Please check if backend is running."
      alert(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  function prevQuestion() {
    if (currentQ > 0) {
      setCurrentQ((prev) => prev - 1)
    }
  }

  if (!started) {
    return (
      <section id="discovery" className="py-24 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mx-auto animate-pulse">
            <Brain className="h-5 w-5" />
            <span>Behavioral Profiling Engine</span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl text-foreground">
            Discover Who You <span className="text-primary">Really</span> Are
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            No generic questions. We analyze your deep psychology, pressure response, and hidden traits to find your true career fit.
          </p>

          <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105" onClick={() => setStarted(true)}>
            Start Profiling
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    )
  }

  if (showResults && aiResult) {
    // Normalize stream and role data (support both old string[] and new object[] shapes)
    const streamsData: { name: string; avgSalaryRange?: string }[] =
      (aiResult.suitable_career_streams ?? []).map((s: any) =>
        typeof s === "object" && s !== null ? s : { name: s }
      )
    const rolesData: { role: string; avgStartingSalary?: string }[] =
      (aiResult.ideal_career_roles ?? aiResult.suitable_career_roles ?? []).map((r: any) =>
        typeof r === "object" && r !== null ? r : { role: r }
      )
    const personalityAxes: { axis: string; score: number }[] =
      aiResult.personality_axes ?? []

    return (
      <section id="discovery" className="py-24 px-4">
        <div className="mx-auto max-w-6xl flex flex-col gap-10">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-4xl text-foreground">Your Behavioral Profile</h2>
            <p className="text-muted-foreground">AI-Generated Deep Psychoanalysis</p>
          </div>

          {/* ── Personality Radar Chart ── */}
          {personalityAxes.length > 0 && (
            <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
              <h3 className="font-serif text-2xl mb-6 text-center">Personality Profile Radar</h3>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart cx="50%" cy="50%" outerRadius={110} data={personalityAxes}>
                  <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 13, fontWeight: 600 }}
                  />
                  <Radar
                    name="You"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value}/100`, "Score"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Insight Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card rounded-3xl p-8 border-l-4 border-l-primary flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                <h3 className="font-serif text-2xl">Core Personality Insight</h3>
              </div>
              <p className="text-lg leading-relaxed text-foreground/90">
                <BlurText
                  text={aiResult.core_personality_insight}
                  delay={50}
                  animateBy="words"
                  direction="top"
                  className="text-lg leading-relaxed text-foreground/90"
                />
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border-l-4 border-l-amber-500 bg-amber-50/10 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <h3 className="font-serif text-2xl">Honest Reality Check</h3>
              </div>
              <p className="text-lg leading-relaxed text-foreground/90 italic">
                <BlurText
                  text={`"${aiResult.honest_reality_check}"`}
                  delay={50}
                  animateBy="words"
                  direction="top"
                  className="text-lg leading-relaxed text-foreground/90 italic"
                />
              </p>
            </div>
          </div>

          {/* Suitable Careers & Roles */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* ── Suitable Streams — clickable selection cards ── */}
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h3 className="font-serif text-2xl mb-2 flex items-center gap-3">
                  <Target className="w-6 h-6 text-green-500" />
                  Suitable Streams
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Select a stream below before generating your roadmap.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {streamsData.map((stream, i) => {
                    const isSelected = selectedStream === stream.name
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedStream(stream.name)}
                        className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${isSelected
                          ? "border-green-500 bg-green-500/10 shadow-md scale-[1.02]"
                          : "border-green-500/20 bg-green-500/5 hover:border-green-500/60 hover:shadow-md"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-green-700 text-base leading-snug">
                            <BlurText text={stream.name} delay={30} animateBy="words" direction="top" />
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        {stream.avgSalaryRange && (
                          <p className="mt-2 text-xs font-medium text-green-600/80">
                            Avg: {stream.avgSalaryRange}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Ideal Roles with salary ── */}
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h3 className="font-serif text-2xl mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-500" />
                  Ideal Roles
                </h3>
                <div className="flex flex-wrap gap-3">
                  {rolesData.map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-start px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20"
                    >
                      <span className="text-blue-700 text-sm font-semibold">
                        <BlurText text={item.role} delay={30} animateBy="words" direction="top" />
                      </span>
                      {item.avgStartingSalary && (
                        <span className="text-xs text-blue-500/80 mt-0.5 font-medium">
                          Starting: {item.avgStartingSalary}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Avoid & Gaps */}
            <div className="space-y-8">
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h3 className="font-serif text-xl mb-4 flex items-center gap-2 text-red-600">
                  <Shield className="w-5 h-5" />
                  Avoid These Careers
                </h3>
                <ul className="space-y-3">
                  {aiResult.career_types_to_avoid?.map((career: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80">
                      <span className="text-red-500">✕</span>
                      <BlurText text={career} delay={30} animateBy="words" direction="top" />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h3 className="font-serif text-xl mb-4 flex items-center gap-2 text-amber-600">
                  <Zap className="w-5 h-5" />
                  Critical Skill Gaps
                </h3>
                <ul className="space-y-3">
                  {aiResult.skill_gaps?.map((gap: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80">
                      <span className="text-amber-500">⚠</span>
                      <BlurText text={gap} delay={30} animateBy="words" direction="top" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Roadmap Button — only active when stream selected ── */}
          <div className="text-center pt-8 pb-8">
            {!selectedStream && (
              <p className="text-sm text-muted-foreground mb-4">
                ↑ Select a stream above to unlock your roadmap
              </p>
            )}
            <Button
              size="lg"
              className="h-14 px-10 text-lg rounded-full"
              onClick={handleCreateRoadmap}
              disabled={loadingRoadmap || !selectedStream}
            >
              {loadingRoadmap ? (
                <>Generating Your Roadmap <Loader2 className="ml-2 h-5 w-5 animate-spin" /></>
              ) : (
                <>Generate My Career Roadmap <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </div>

          {/* Generated Roadmap */}
          {roadmapData && (
            <div id="generated-roadmap" className="animate-in fade-in slide-in-from-bottom-10 duration-700">
              <CareerRoadmap roadmapData={roadmapData} />

              {/* 90-Day Sprint Planner */}
              <div className="mx-auto max-w-5xl px-4 pb-16">
                <SprintPlanner
                  selectedStream={selectedStream ?? ""}
                  phase1Focus={roadmapData.phases?.[0]?.focus ?? []}
                  personalityProfile={aiResult?.core_personality_insight ?? ""}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  const q = questions[currentQ]
  const QuestionIcon = q.icon

  return (
    <section id="discovery" className="py-24 px-4 min-h-screen flex flex-col items-center justify-center bg-accent/5">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between text-muted-foreground mb-8">
          <span className="font-mono text-sm">QS {currentQ + 1} / {questions.length}</span>
          <div className="flex items-center gap-2 text-primary font-bold animate-pulse">
            <Clock className="w-4 h-4" />
            <span>Take your time</span>
          </div>
        </div>

        <Progress value={progress} className="h-1 mb-12 bg-gray-200" />

        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto text-primary">
              <QuestionIcon className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
              {q.text}
            </h2>
          </div>

          <div className="grid gap-4">
            {q.options.map((option) => (
              <button
                key={option.value}
                onClick={() => selectAnswer(option.value)}
                disabled={loading}
                className={`group relative p-6 rounded-2xl border-2 text-left transition-all duration-300
                   ${loading ? 'opacity-50 cursor-not-allowed border-transparent bg-gray-100' :
                    answers[currentQ] === option.value
                      ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                      : 'border-transparent bg-white shadow-sm hover:border-primary/30 hover:shadow-md'
                  }
                 `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg text-foreground/90">{option.label}</span>
                  {answers[currentQ] === option.value && (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4">
            <div className="relative">
              <Input
                placeholder="Or type your honest answer here..."
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value)
                  if (e.target.value) {
                    setAnswers((prev) => ({ ...prev, [currentQ]: "" }))
                  }
                }}
                disabled={loading}
                className="h-14 px-6 rounded-2xl border-transparent bg-white shadow-sm focus-visible:ring-primary/20 text-lg"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-4 rounded-xl bg-red-50 text-red-600 text-center text-sm font-medium">
            {error}
          </div>
        )}

        <div className="mt-12 flex justify-between items-center">
          <Button variant="ghost" onClick={prevQuestion} disabled={currentQ === 0 || loading}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Button
            size="lg"
            onClick={nextQuestion}
            disabled={(!answers[currentQ] && !customInput) || loading}
            className="rounded-full px-8"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
            ) : (
              <>{currentQ === questions.length - 1 ? "Get Analysis" : "Next Question"} <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
