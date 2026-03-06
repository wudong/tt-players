import type { ButtonHTMLAttributes } from 'react';

interface PressButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    className?: string;
    onClick?: () => void;
    onPress?: () => void;
}

export function PressButton({
    className,
    onClick,
    onPress,
    type = 'button',
    ...props
}: PressButtonProps) {
    return (
        <button
            {...props}
            type={type}
            onClick={() => {
                onClick?.();
                onPress?.();
            }}
            className={className}
        />
    );
}
