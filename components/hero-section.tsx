"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background shapes */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 animate-pulse-soft blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/10 animate-pulse-soft blur-3xl" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm w-fit">
            <Sparkles className="h-4 w-4" />
            <span>Your future starts here</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-balance text-foreground">
            From confusion
            <br />
            <span className="text-primary">to clarity.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
            {"You don't need all the answers right now. CareerCoach helps you explore your strengths, understand your options, and build a path that feels right — at your own pace."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/discover">
                Discover My Career
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-foreground" asChild>
              <Link href="/goals">I Know My Goal</Link>
            </Button>
          </div>
        </div>

        <div className="relative flex items-center justify-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative w-full max-w-md aspect-square animate-float">
            <Image
              src="/hero-illustration.jpg"
              alt="Student exploring different career paths at a crossroads"
              fill
              className="object-contain rounded-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
