import { useId } from 'react'
import type { ChangeEvent, FocusEvent, InputHTMLAttributes, ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { cx } from './ui'
import { Input } from '@/components/ui/input'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	icon?: ReactNode
	rightIcon?: ReactNode
	className?: string
	outerClassName?: string
	label?: string
	error?: string
	register?: UseFormRegisterReturn
	required?: boolean
	errorClassName?: string
}

export default function CustomInput({
	type = 'text',
	placeholder,
	icon,
	rightIcon,
	className = '',
	outerClassName = '',
	errorClassName = '',
	label,
	error,
	register,
	required = false,
	...props
}: InputProps) {
	const generatedId = useId()
	const inputId = props.id ?? register?.name ?? generatedId
	const describedBy = cx(props['aria-describedby'], error && inputId ? `${inputId}-error` : undefined)
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		void register?.onChange(event)
		props.onChange?.(event)
	}
	const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
		void register?.onBlur(event)
		props.onBlur?.(event)
	}

	return (
		<div className={cx('flex flex-col gap-2', outerClassName)}>
			{label && (
				<label className="text-sm font-medium text-foreground" htmlFor={inputId}>
					{label}{required && <span className="ml-1 text-destructive">*</span>}
				</label>
			)}

			<div className="relative">
				{icon && (
					<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
						{icon}
					</span>
				)}

				<Input
					type={type}
					placeholder={placeholder}
					className={cx(
						'h-10 w-full',
						Boolean(icon) && 'pl-10',
						Boolean(rightIcon) && 'pr-11',
						error && 'border-destructive',
						className,
					)}
					{...props}
					{...register}
					id={inputId}
					name={register?.name ?? props.name}
					required={required}
					aria-invalid={error ? true : props['aria-invalid']}
					aria-describedby={describedBy || undefined}
					onChange={handleChange}
					onBlur={handleBlur}
				/>

				{rightIcon && (
					<span className="absolute right-2 top-1/2 -translate-y-1/2 leading-none">
						{rightIcon}
					</span>
				)}
			</div>

			{error && (
				<span id={inputId ? `${inputId}-error` : undefined} className={cx('text-xs text-destructive', errorClassName)} role="alert">
					{error}
				</span>
			)}
		</div>
	)
}
