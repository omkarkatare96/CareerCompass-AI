"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { LayoutDashboard } from "lucide-react"
import { ProtectedRoute } from "@/lib/protected-route"

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <main className="min-h-screen">
                <Navbar />
                <section className="py-24 px-4">
                    <div className="mx-auto max-w-5xl flex flex-col gap-8">
                        <div className="text-center flex flex-col gap-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm w-fit mx-auto">
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Dashboard</span>
                            </div>
                            <h2 className="font-serif text-3xl md:text-4xl text-foreground text-balance">
                                Your Career Dashboard
                            </h2>
                            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                                Track your progress, manage your goals, and stay on top of your career journey.
                            </p>
                        </div>

                        <div className="glass-card rounded-2xl p-8 text-center">
                            <p className="text-muted-foreground">
                                Dashboard features coming soon. This is where you'll track your progress and manage your career goals.
                            </p>
                        </div>
                    </div>
                </section>
                <Footer />
            </main>
        </ProtectedRoute>
    )
}
