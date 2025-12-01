'use client';

import * as React from 'react';
import { RuleTemplate, TEMPLATE_CATEGORIES } from '@/lib/rule-templates';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Plus } from 'lucide-react';
import { conditionToString, countConditions } from '@/lib/condition-utils';

interface TemplateCardProps {
    template: RuleTemplate;
    onPreview: (template: RuleTemplate) => void;
    onDeploy: (template: RuleTemplate) => void;
}

const severityColors = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-blue-500 text-white',
};

export function TemplateCard({ template, onPreview, onDeploy }: TemplateCardProps) {
    const categoryInfo = TEMPLATE_CATEGORIES[template.category];
    const conditionCount = countConditions(template.conditions);
    const previewText = conditionToString(template.conditions);

    return (
        <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="text-3xl group-hover:scale-110 transition-transform">
                                {categoryInfo.icon}
                            </span>
                            <Badge variant="outline" className="font-medium">
                                {categoryInfo.label}
                            </Badge>
                            <Badge className={`${severityColors[template.severity]} font-bold`}>
                                {template.severity.toUpperCase()}
                            </Badge>
                        </div>
                        <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text break-words">
                            {template.name}
                        </CardTitle>
                    </div>
                </div>
                <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                    {template.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 px-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        <span className="text-xs font-medium text-muted-foreground px-2 whitespace-nowrap">
                            {conditionCount} condition{conditionCount !== 1 ? 's' : ''}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
                    </div>
                    <div className="font-mono text-xs bg-gradient-to-br from-muted/80 to-muted/50 p-3 rounded-lg border line-clamp-2 shadow-inner break-all">
                        {previewText}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {template.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs font-medium hover:bg-secondary/80 transition-colors">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-4 border-t bg-muted/20 px-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(template)}
                    className="flex-1 font-medium hover:bg-accent transition-colors min-w-0"
                >
                    <Eye className="mr-1 h-3.5 w-3.5 shrink-0" />
                    <span>Preview</span>
                </Button>
                <Button
                    size="sm"
                    onClick={() => onDeploy(template)}
                    className="flex-1 font-medium bg-primary hover:bg-primary/90 shadow-sm min-w-0"
                >
                    <Plus className="mr-1 h-3.5 w-3.5 shrink-0" />
                    <span>Deploy</span>
                </Button>
            </CardFooter>
        </Card>
    );
}
