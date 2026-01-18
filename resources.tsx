import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Lightbulb, Scale, FileText } from "lucide-react";
import type { Resource } from "@shared/schema";

const categoryIcons: Record<string, any> = {
  guides: BookOpen,
  tips: Lightbulb,
  laws: Scale,
  templates: FileText,
};

const categoryLabels: Record<string, string> = {
  guides: "Guides",
  tips: "Tips",
  laws: "Laws & Rights",
  templates: "Templates",
};

export default function Resources() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const categories = ["all", ...Object.keys(categoryLabels)];
  const filteredResources = activeTab === "all" 
    ? resources 
    : resources?.filter((r) => r.category === activeTab);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-resources-title">Resources</h1>
        <p className="text-muted-foreground">Learn about credit repair and your rights</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap" data-testid="tabs-resources">
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredResources?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No resources found in this category.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredResources?.map((resource) => {
                const Icon = categoryIcons[resource.category] || BookOpen;
                return (
                  <Card key={resource.id} data-testid={`card-resource-${resource.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {categoryLabels[resource.category] || resource.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {resource.content}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
