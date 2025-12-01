'use client';

import * as React from 'react';
import { useState } from 'react';
import { RuleTemplate, RULE_TEMPLATES, TEMPLATE_CATEGORIES, TemplateCategory } from '@/lib/rule-templates';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateCard } from './template-card';
import { ConditionPreview } from './condition-preview';
import { Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplatesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeploy: (template: RuleTemplate) => void;
}

export function TemplatesDialog({ open, onOpenChange, onDeploy }: TemplatesDialogProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'all' | TemplateCategory>('all');
    const [previewTemplate, setPreviewTemplate] = useState<RuleTemplate | null>(null);

    // Filter templates based on search and category
    const filteredTemplates = RULE_TEMPLATES.filter((template) => {
        const matchesSearch =
            search === '' ||
            template.name.toLowerCase().includes(search.toLowerCase()) ||
            template.description.toLowerCase().includes(search.toLowerCase()) ||
            template.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const handleDeploy = (template: RuleTemplate) => {
        onDeploy(template);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
                    <DialogHeader className="border-b pb-4 shrink-0">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            Browse Rule Templates
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Deploy pre-configured detection rules for common security threats
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col space-y-4 pt-2 overflow-hidden">
                        {/* Search */}
                        <div className="relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search templates by name, description, or tags..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-11 border-2 focus:border-primary transition-colors"
                            />
                        </div>

                        {/* Category Tabs */}
                        <Tabs value={selectedCategory} onValueChange={(v: string) => setSelectedCategory(v as any)} className="flex-1 flex flex-col overflow-hidden">
                            <div className="overflow-x-auto shrink-0 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-border scrollbar-track-transparent">
                                <TabsList className="inline-flex w-auto min-w-full h-12 bg-muted/50 p-1.5">
                                    <TabsTrigger value="all" className="font-medium whitespace-nowrap">
                                        All Templates ({RULE_TEMPLATES.length})
                                    </TabsTrigger>
                                    {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => {
                                        const count = RULE_TEMPLATES.filter((t) => t.category === key).length;
                                        return (
                                            <TabsTrigger key={key} value={key} className="font-medium whitespace-nowrap">
                                                <span className="mr-1.5">{category.icon}</span>
                                                {category.label} ({count})
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>
                            </div>

                            <TabsContent value={selectedCategory} className="flex-1 mt-6 overflow-hidden">
                                <ScrollArea className="h-full pr-4">
                                    {filteredTemplates.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="text-6xl mb-4 opacity-20">🔍</div>
                                            <p className="text-lg font-medium text-muted-foreground">No templates found</p>
                                            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6">
                                            {filteredTemplates.map((template) => (
                                                <TemplateCard
                                                    key={template.id}
                                                    template={template}
                                                    onPreview={setPreviewTemplate}
                                                    onDeploy={handleDeploy}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
                <DialogContent className="max-w-3xl">
                    {previewTemplate && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{previewTemplate.name}</DialogTitle>
                                <DialogDescription>{previewTemplate.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    {previewTemplate.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <ConditionPreview condition={previewTemplate.conditions} />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
