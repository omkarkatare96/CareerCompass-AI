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
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts"

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
  const [timer, setTimer] = useState(5)

  useEffect(() => {
    if (started && !showResults) {
      setTimer(5)
      const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [currentQ, started, showResults])

  const progress = ((currentQ + 1) / questions.length) * 100

  function selectAnswer(answerValue: string) {
    if (timer > 0) return
    setAnswers((prev) => ({
      ...prev,
      [currentQ]: answerValue,
    }))
  }

  async function nextQuestion() {
    // Get current selected answer
    let finalAnswerForStep = answers[currentQ];

    // If user typed custom input, override
    if (customInput && customInput.trim() !== "") {
      finalAnswerForStep = customInput.trim();
      setAnswers((prev) => ({
        ...prev,
        [currentQ]: customInput.trim(),
      }));
      setCustomInput("");
    }

    // Safety check: if still no answer, stop
    if (!finalAnswerForStep) {
      console.log("No answer selected for question:", currentQ);
      return;
    }

    // Create updated answers object
    const updatedAnswers = {
      ...answers,
      [currentQ]: finalAnswerForStep,
    };

    // If not last question → move next
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      // Last question → submit
      console.log("Submitting answers:", updatedAnswers);
      submitDiscover(updatedAnswers);
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
        throw new Error("Server error")
      }

      const result = await response.json()

      // 👇 THIS IS IMPORTANT ADDITION
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
      setTimer(0) // No timer when going back
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
    return (
      <section id="discovery" className="py-24 px-4">
        <div className="mx-auto max-w-6xl flex flex-col gap-10">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-4xl text-foreground">Your Behavioral Profile</h2>
            <p className="text-muted-foreground">AI-Generated Deep Psychoanalysis</p>
          </div>

          {/* Top Insight Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card rounded-3xl p-8 border-l-4 border-l-primary flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                <h3 className="font-serif text-2xl">Core Personality Insight</h3>
              </div>
              <p className="text-lg leading-relaxed text-foreground/90">
                {aiResult.core_personality_insight}
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border-l-4 border-l-amber-500 bg-amber-50/10 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <h3 className="font-serif text-2xl">Honest Reality Check</h3>
              </div>
              <p className="text-lg leading-relaxed text-foreground/90 italic">
                &quot;{aiResult.honest_reality_check}&quot;
              </p>
            </div>
          </div>

          {/* Suitable Careers & Roles */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h3 className="font-serif text-2xl mb-6 flex items-center gap-3">
                  <Target className="w-6 h-6 text-green-500" />
                  Suitable Streams
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {aiResult.suitable_career_streams.map((stream: string, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-green-700 font-medium">
                      {stream}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h3 className="font-serif text-2xl mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-500" />
                  Ideal Roles
                </h3>
                <div className="flex flex-wrap gap-3">
                  {aiResult.suitable_career_roles.map((role: string, i: number) => (
                    <span key={i} className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-700 text-sm font-semibold">
                      {role}
                    </span>
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
                  {aiResult.career_types_to_avoid.map((career: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80">
                      <span className="text-red-500">✕</span> {career}
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
                  {aiResult.skill_gaps.map((gap: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80">
                      <span className="text-amber-500">⚠</span> {gap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center pt-8">
            <Button size="lg" asChild className="h-14 px-10 text-lg rounded-full">
              <Link href="/roadmap">
                Generate My Career Roadmap
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
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
          {timer > 0 && (
            <div className="flex items-center gap-2 text-amber-600 font-bold animate-pulse">
              <Clock className="w-4 h-4" />
              <span>Wait {timer}s to answer</span>
            </div>
          )}
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
                disabled={timer > 0}
                className={`group relative p-6 rounded-2xl border-2 text-left transition-all duration-300
                   ${timer > 0 ? 'opacity-50 cursor-not-allowed border-transparent bg-gray-100' :
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
                    setAnswers((prev) => ({ ...prev, [currentQ]: "" })) // Clear predefined selection
                  }
                }}
                disabled={timer > 0}
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
            disabled={(!answers[currentQ] && !customInput) || timer > 0 || loading}
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
