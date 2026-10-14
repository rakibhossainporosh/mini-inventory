import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-right"
            richColors
            closeButton
            duration={4000}
            style={
                {
                    '--normal-bg': 'var(--popover, #ffffff)',
                    '--normal-text': 'var(--popover-foreground, #0f172a)',
                    '--normal-border': 'var(--border, #e2e8f0)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
