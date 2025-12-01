import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BulkActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    action: 'resolved' | 'investigating' | 'false_positive' | 'delete';
    count: number;
    onConfirm: () => void;
}

const actionLabels = {
    resolved: 'Mark as Resolved',
    investigating: 'Mark as Investigating',
    false_positive: 'Mark as False Positive',
    delete: 'Delete',
};

const actionDescriptions = {
    resolved: 'mark as resolved',
    investigating: 'mark as investigating',
    false_positive: 'mark as false positive',
    delete: 'permanently delete',
};

export function BulkActionDialog({
    open,
    onOpenChange,
    action,
    count,
    onConfirm,
}: BulkActionDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {actionLabels[action]} {count} Alerts?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {action === 'delete' ? (
                            <>
                                This will permanently delete <strong>{count}</strong> selected alert{count > 1 ? 's' : ''}.
                                This action cannot be undone.
                            </>
                        ) : (
                            <>
                                This will {actionDescriptions[action]} <strong>{count}</strong> selected alert{count > 1 ? 's' : ''}.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={action === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        {actionLabels[action]}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
