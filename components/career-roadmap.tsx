"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Search,
  Layers,
  Wrench,
  BookOpen,
  Rocket,
  CheckCircle2,
  XCircle,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const phases = [
  {
    id: "exploration",
    title: "Exploration",
    subtitle: "Months 1-2",
    icon: Search,
    color: "bg-primary/10 text-primary border-primary/20",
    dotColor: "bg-primary",
    focus: [
      "Research 3-5 career paths that interest you",
      "Talk to professionals or mentors in those fields",
      "Watch day-in-the-life videos to understand reality",
      "Read introductory articles and books about each field",
    ],
    avoid: [
      "Making a final decision too quickly",
      "Listening only to social pressure or trends",
      "Ignoring fields that seem unconventional",
    ],
    resources: [
      { title: "Career Exploration Guide", type: "Article" },
      { title: "How to Find a Mentor", type: "Video" },
    ],
  },
  {
    id: "foundation",
    title: "Foundation",
    subtitle: "Months 3-4",
    icon: Layers,
    color: "bg-accent/10 text-accent border-accent/20",
    dotColor: "bg-accent",
    focus: [
      "Build strong fundamentals in your chosen direction",
      "Focus on 10th/12th board exam preparation",
      "Start learning basic skills relevant to your path",
      "Create a study schedule and stick to it",
    ],
    avoid: [
      "Skipping foundational subjects for advanced ones",
      "Comparing your pace to others",
      "Multitasking on too many subjects at once",
    ],
    resources: [
      { title: "Study Planning Template", type: "PDF" },
      { title: "Foundation Building Strategies", type: "Video" },
    ],
  },
  {
    id: "skill-building",
    title: "Skill Building",
    subtitle: "Months 5-8",
    icon: Wrench,
    color: "bg-chart-3/10 text-foreground border-chart-3/20",
    dotColor: "bg-chart-3",
    focus: [
      "Pick up specific skills: coding, design, writing, etc.",
      "Join online courses or workshops",
      "Build small projects to practice what you learn",
      "Start networking with people in your chosen field",
    ],
    avoid: [
      "Buying courses without completing them",
      "Perfectionism that prevents starting",
      "Ignoring soft skills like communication",
    ],
    resources: [
      { title: "Free Learning Platforms Guide", type: "Article" },
      { title: "Building Your First Project", type: "Video" },
    ],
  },
  {
    id: "preparation",
    title: "Preparation",
    subtitle: "Months 9-10",
    icon: BookOpen,
    color: "bg-chart-4/10 text-foreground border-chart-4/20",
    dotColor: "bg-chart-4",
    focus: [
      "Register for relevant entrance exams",
      "Create a focused study plan with mock tests",
      "Prepare application materials (portfolio, resume, SOP)",
      "Research colleges and programs thoroughly",
    ],
    avoid: [
      "Leaving registration for the last minute",
      "Only studying from one resource",
      "Neglecting health and sleep during prep",
    ],
    resources: [
      { title: "Exam Preparation Checklist", type: "PDF" },
      { title: "Application Writing Tips", type: "Article" },
    ],
  },
  {
    id: "execution",
    title: "Execution",
    subtitle: "Months 11-12",
    icon: Rocket,
    color: "bg-chart-5/10 text-foreground border-chart-5/20",
    dotColor: "bg-chart-5",
    focus: [
      "Take your exams with confidence and calm",
      "Submit applications before deadlines",
      "Follow up on results and explore alternatives",
      "Celebrate how far you have come, regardless of outcome",
    ],
    avoid: [
      "Panicking if one exam does not go well",
      "Putting all eggs in one basket",
      "Stopping learning after the exam",
    ],
    resources: [
      { title: "Exam Day Tips", type: "Article" },
      { title: "What to Do After Results", type: "Video" },
    ],
  },
]

export function CareerRoadmap() {
  const [expandedPhase, setExpandedPhase] = useState<string>("exploration")

  return (
    <section id="roadmap" className="py-24 px-4">
      <div className="mx-auto max-w-5xl flex flex-col gap-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm w-fit">
              <Rocket className="h-4 w-4" />
              <span>Your Career Roadmap</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-balance">
              A clear path, one step at a time
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-lg">
              {"Your journey doesn't need to be perfect. It needs to be consistent. Here's a phase-by-phase guide to help you move forward with confidence."}
            </p>
          </div>

          <div className="relative w-full max-w-xs aspect-square mx-auto lg:mx-0 lg:ml-auto">
            <Image
              src="/roadmap-illustration.jpg"
              alt="A winding road leading upward through a serene landscape with milestones"
              fill
              className="object-contain rounded-2xl"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          <div className="flex flex-col gap-4">
            {phases.map((phase, index) => {
              const isExpanded = expandedPhase === phase.id
              const PhaseIcon = phase.icon

              return (
                <div key={phase.id} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 md:left-6 top-6 w-4 h-4 rounded-full ${phase.dotColor} border-4 border-background z-10 hidden md:block`} />

                  <div className="md:ml-16">
                    <button
                      type="button"
                      onClick={() => setExpandedPhase(isExpanded ? "" : phase.id)}
                      className={`w-full glass-card rounded-2xl p-6 text-left transition-all hover:shadow-md ${
                        isExpanded ? "shadow-lg shadow-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl ${phase.color} flex items-center justify-center`}>
                            <PhaseIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg text-foreground">{phase.title}</h3>
                            <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-6 flex flex-col gap-6" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                          {/* What to focus on */}
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              What to focus on
                            </h4>
                            <ul className="flex flex-col gap-2">
                              {phase.focus.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* What to avoid */}
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive" />
                              What to avoid
                            </h4>
                            <ul className="flex flex-col gap-2">
                              {phase.avoid.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0 mt-1.5" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Resources */}
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                              <Play className="h-4 w-4 text-accent" />
                              Resources
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {phase.resources.map((resource) => (
                                <span
                                  key={resource.title}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  {resource.type === "Video" ? (
                                    <Play className="h-3 w-3" />
                                  ) : (
                                    <BookOpen className="h-3 w-3" />
                                  )}
                                  {resource.title}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Phase progress</span>
                              <span>Not started</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full ${phase.dotColor} w-0 transition-all`} />
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
