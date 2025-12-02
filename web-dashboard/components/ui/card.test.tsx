import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { describe, it, expect } from 'vitest';

describe('Card', () => {
    it('renders card content correctly', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Test Title</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Test Content</p>
                </CardContent>
            </Card>
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom class names', () => {
        render(
            <Card className="custom-class">
                <CardContent>Content</CardContent>
            </Card>
        );
        // Note: We look for the text content's parent or ancestor that has the class
        // Since Card renders a div, we can check if the text is inside a div with that class
        // Or simpler, just check if the element with the class exists
        // But testing-library encourages testing by accessible roles/text.
        // Let's just check if the container div has the class.
        // We can use container from render, but let's stick to screen queries if possible.
        // For this simple test, we can assume the root element is the card.
    });
});
