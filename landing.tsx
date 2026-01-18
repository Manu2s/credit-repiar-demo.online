import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, TrendingUp, FileText, CheckCircle, Sparkles, ExternalLink, Mail } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import heroImage from "@assets/generated_images/dream_home_financial_success.png";

export default function Landing() {
  const [showGetStarted, setShowGetStarted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Credit Repair Pro</span>
          </div>
          <a href="/login">
            <Button data-testid="button-login">Log In</Button>
          </a>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="relative h-[400px] md:h-[500px] overflow-hidden">
            <img 
              src={heroImage} 
              alt="Your dream home awaits" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Credit Solution is Your Future Home
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-2xl">
                Track disputes, manage your credit profile, and improve your score with our comprehensive credit repair tools.
              </p>
              <button
                onClick={() => setShowGetStarted(true)}
                className="relative inline-flex items-center gap-2 px-8 py-4 rounded-md font-bold text-white text-lg overflow-hidden"
                style={{
                  background: "linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0080ff, #8000ff, #ff0080, #ff0000)",
                  backgroundSize: "200% 100%",
                  animation: "rainbow-shift 3s linear infinite",
                }}
                data-testid="button-get-started-free"
              >
                <Sparkles className="h-6 w-6" />
                <span>Simple Fast and Easy - Start for FREE Today</span>
              </button>
            </div>
          </div>
        </section>

        <Dialog open={showGetStarted} onOpenChange={setShowGetStarted}>
          <DialogContent 
            className="sm:max-w-md overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,0,0,0.1), rgba(255,128,0,0.1), rgba(255,255,0,0.1), rgba(0,255,0,0.1), rgba(0,255,255,0.1), rgba(0,128,255,0.1), rgba(128,0,255,0.1))",
            }}
          >
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0080ff, #8000ff, #ff0080)",
                backgroundSize: "200% 100%",
                animation: "rainbow-shift 3s linear infinite",
              }}
            />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Start Your Credit Journey
              </DialogTitle>
              <DialogDescription className="text-base">
                You're just a few steps away from better credit!
              </DialogDescription>
            </DialogHeader>
            <div className="relative z-10 space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Free Credit Analysis</p>
                  <p className="text-sm text-muted-foreground">Get a complete review of your credit report</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Dispute Assistance</p>
                  <p className="text-sm text-muted-foreground">We help you challenge inaccurate items</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Score Tracking</p>
                  <p className="text-sm text-muted-foreground">Monitor your progress across all bureaus</p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <p className="text-sm text-center text-muted-foreground">Sign up or log in with:</p>
                <div className="grid grid-cols-3 gap-2">
                  <a href="/login" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      data-testid="button-login-google"
                    >
                      <SiGoogle className="h-4 w-4" />
                      Google
                    </Button>
                  </a>
                  <a href="/login" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      data-testid="button-login-apple"
                    >
                      <SiApple className="h-4 w-4" />
                      Apple
                    </Button>
                  </a>
                  <a href="/login" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      data-testid="button-login-email"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  </a>
                </div>
                <a href="/login" className="block">
                  <Button 
                    className="w-full"
                    size="lg"
                    data-testid="button-popup-continue"
                  >
                    Continue
                  </Button>
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-4">
              Connect Your Credit Bureaus
            </h2>
            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              Link your accounts to track your credit scores in real-time across all three major bureaus
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardHeader className="pb-2">
                  <div className="mx-auto h-16 w-16 rounded-lg flex items-center justify-center font-bold text-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
                    E
                  </div>
                  <CardTitle>Experian</CardTitle>
                  <CardDescription>Free credit monitoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Set
                  </span>
                  <a 
                    href="https://www.experian.com/consumer-products/free-credit-report.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2" data-testid="button-connect-experian">
                      <ExternalLink className="h-4 w-4" />
                      Open Account
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader className="pb-2">
                  <div className="mx-auto h-16 w-16 rounded-lg flex items-center justify-center font-bold text-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2">
                    Q
                  </div>
                  <CardTitle>Equifax</CardTitle>
                  <CardDescription>Credit reports & scores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Set
                  </span>
                  <a 
                    href="https://www.equifax.com/personal/credit-report-services/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2" data-testid="button-connect-equifax">
                      <ExternalLink className="h-4 w-4" />
                      Open Account
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader className="pb-2">
                  <div className="mx-auto h-16 w-16 rounded-lg flex items-center justify-center font-bold text-2xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mb-2">
                    T
                  </div>
                  <CardTitle>TransUnion</CardTitle>
                  <CardDescription>Credit monitoring service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Set
                  </span>
                  <a 
                    href="https://www.transunion.com/credit-monitoring" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2" data-testid="button-connect-transunion">
                      <ExternalLink className="h-4 w-4" />
                      Open Account
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need to Repair Your Credit
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Track Your Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Monitor your credit scores from all three major bureaus in one place.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Manage Disputes</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Create, track, and manage disputes with credit bureaus and creditors.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Action Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Stay organized with a personalized task list for your credit repair journey.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Learn & Grow</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Access guides, templates, and resources to understand your rights.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">Ready to Improve Your Credit?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of users who have successfully improved their credit scores using Credit Repair Pro.
            </p>
            <a href="/login">
              <Button size="lg" data-testid="button-start-now">Start Now</Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>Credit Repair Pro - Your path to better credit</p>
        </div>
      </footer>
    </div>
  );
}
