import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, CreditCard, FileText, CheckSquare, BookOpen, Settings, LayoutDashboard } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface TourStep {
  target: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    target: "[data-tour='dashboard']",
    title: "Welcome to Credit Repair Pro",
    content: "This is your dashboard where you can see an overview of your credit repair journey, including your scores from all three bureaus and key stats.",
    icon: <LayoutDashboard className="h-5 w-5" />,
    position: "right",
  },
  {
    target: "[data-tour='credit-plans']",
    title: "Credit Builder Plans",
    content: "Create and manage credit-builder payment plans. Make regular payments to build your credit history and improve your scores.",
    icon: <CreditCard className="h-5 w-5" />,
    position: "right",
  },
  {
    target: "[data-tour='disputes']",
    title: "Manage Disputes",
    content: "Track and manage disputes with credit bureaus. File new disputes for inaccurate items and monitor their progress.",
    icon: <FileText className="h-5 w-5" />,
    position: "right",
  },
  {
    target: "[data-tour='tasks']",
    title: "Task Manager",
    content: "Stay organized with your credit repair action items. Create tasks, set due dates, and track your progress.",
    icon: <CheckSquare className="h-5 w-5" />,
    position: "right",
  },
  {
    target: "[data-tour='resources']",
    title: "Educational Resources",
    content: "Learn about credit repair strategies, understand your rights, and get tips for improving your credit score.",
    icon: <BookOpen className="h-5 w-5" />,
    position: "right",
  },
  {
    target: "[data-tour='settings']",
    title: "Your Settings",
    content: "Update your profile, set your credit scores, manage consents, and customize your account preferences.",
    icon: <Settings className="h-5 w-5" />,
    position: "right",
  },
];

interface GuidedTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export function GuidedTour({ onComplete, isOpen }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateTargetPosition = useCallback(() => {
    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    
    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition);
    
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [isOpen, currentStep, updateTargetPosition]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(updateTargetPosition, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await apiRequest("PUT", "/api/user-profile", { tourCompleted: true });
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile"] });
    } catch (error) {
      console.error("Failed to save tour completion:", error);
    }
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  
  const getTooltipPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%" };
    
    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (step.position) {
      case "right":
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
        };
      case "left":
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
        };
      case "bottom":
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2 - tooltipWidth / 2}px`,
        };
      case "top":
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${targetRect.left + targetRect.width / 2 - tooltipWidth / 2}px`,
        };
      default:
        return { top: "50%", left: "50%" };
    }
  };

  const tooltipStyle = getTooltipPosition();

  return createPortal(
    <div className="fixed inset-0 z-[9999]" data-testid="guided-tour-overlay">
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleSkip}
      />
      
      {targetRect && isVisible && (
        <div
          className="absolute bg-transparent ring-4 ring-primary ring-offset-2 ring-offset-background rounded-md transition-all duration-300 pointer-events-none"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      <Card
        className={cn(
          "absolute w-80 shadow-xl transition-all duration-300",
          !isVisible && "opacity-0"
        )}
        style={tooltipStyle}
        data-testid="tour-tooltip"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                {step.icon}
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSkip}
              className="h-8 w-8"
              data-testid="button-tour-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">{step.content}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-0">
          <div className="flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  index === currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrev}
                data-testid="button-tour-prev"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={handleNext}
              data-testid="button-tour-next"
            >
              {currentStep === tourSteps.length - 1 ? (
                "Finish"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <Button 
          variant="ghost" 
          className="text-white hover:text-white hover:bg-white/10"
          onClick={handleSkip}
          data-testid="button-tour-skip"
        >
          Skip Tour
        </Button>
      </div>
    </div>,
    document.body
  );
}
