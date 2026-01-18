import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, UserCircle, X } from "lucide-react";

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      {isOpen && (
        <Card className="mb-2 shadow-lg animate-in slide-in-from-top-2 fade-in duration-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold">Hi there!</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  I'm your virtual assistant. Connect with me for free credit repair help!
                </p>
                <Link href="/support">
                  <Button size="sm" className="w-full gap-2" data-testid="button-popup-chat">
                    <MessageSquare className="h-4 w-4" />
                    Start Chat
                  </Button>
                </Link>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-popup"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-floating-chat"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
