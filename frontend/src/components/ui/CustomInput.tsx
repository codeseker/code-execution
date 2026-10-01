import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { cx } from '../ui'

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

	return (
		<div className={cx('flex flex-col gap-2', outerClassName)}>
			{label && (
				<label className="t-ui-med text-ink" htmlFor={inputId}>
					{label}{required && <span className="ml-1 text-error">*</span>}
				</label>
			)}

			<div className="relative">
				{icon && (
					<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">
						{icon}
					</span>
				)}

				<input
					type={type}
					placeholder={placeholder}
					className={cx(
						'input h-10 w-full',
						Boolean(icon) && 'pl-10',
						Boolean(rightIcon) && 'pr-11',
						error && 'border-error',
						className,
					)}
					{...register}
					{...props}
					id={inputId}
					required={required}
					aria-invalid={error ? true : props['aria-invalid']}
					aria-describedby={describedBy || undefined}
				/>

				{rightIcon && (
					<span className="absolute right-2 top-1/2 -translate-y-1/2 leading-none">
						{rightIcon}
					</span>
				)}
			</div>

			{error && (
				<span id={inputId ? `${inputId}-error` : undefined} className={cx('t-caption text-error', errorClassName)} role="alert">
					{error}
				</span>
			)}
		</div>
	)
}
