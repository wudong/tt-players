import { Button, type ButtonProps } from 'react-aria-components';

interface PressButtonProps extends Omit<ButtonProps, 'onPress'> {
    className?: string;
    onClick?: () => void;
    onPress?: ButtonProps['onPress'];
    disabled?: boolean;
}

export function PressButton({ className, onClick, onPress, disabled, isDisabled, ...props }: PressButtonProps) {
    return (
        <Button
            {...props}
            isDisabled={isDisabled ?? disabled}
            onPress={onPress ?? onClick}
            className={className}
        />
    );
}
