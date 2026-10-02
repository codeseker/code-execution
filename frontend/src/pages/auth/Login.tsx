import { useState } from 'react'
import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import { LOGIN_SHOWCASE } from '../../data'
import { CodeWindow } from '../../components/Code'
import CustomButton from '../../components/CustomButton'
import CustomLink from '../../components/CustomLink'
import { useAppForm } from '../../hooks/useAppForm'
import useLogin, { loginSchema, type LoginFormSchema } from '../../hooks/auth/login/useLogin'
import CustomInput from '../../components/CustomInput';


const showcase = (
  <AuthShowcase
    headline="Practice. Submit. Get better."
    sub="Solve problems in a real editor, run them against test cases, and track your progress over time."
  >
    <CodeWindow
      title="solution.ts"
      code={LOGIN_SHOWCASE.code.join('\n')}
      lang="js"
      copyable={false}
    />
  </AuthShowcase>
)

export default function Login() {
  const [reveal, setReveal] = useState(false);
  const { login, loading } = useLogin();

  const { register, handleSubmit, errors, reset } = useAppForm<LoginFormSchema>({
    defaultValues: {
      email: "",
      password: "",
    },
    schema: loginSchema,
    onSubmit: async (data) => {
      try {
        await login(data);
        reset();
      } catch {
        // form state is already handled by the auth hook
      }
    }
  });

  return (
    <AuthLayout showcase={showcase}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Log in</h1>
          <p className="text-sm leading-7 text-muted-foreground">Enter your details to access your account.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="login-email">
              Email
            </label>
            <CustomInput
              id="login-email"
              className="h-10"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              register={register('email')}
              error={errors?.email?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground" htmlFor="login-password">
                Password
              </label>
              <CustomLink to="/forgot-password" className="link text-xs">
                Forgot password?
              </CustomLink>
            </div>
            <div className="relative">
              <CustomInput
                id="login-password"
                className="h-10 pr-11"
                type={reveal ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                register={register('password')}
                error={errors?.password?.message}
              />
              <CustomButton variant="unstyled"
                type="button"
                className="icon-btn absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2"
                aria-label={reveal ? 'Hide password' : 'Show password'}
                onClick={() => setReveal((v) => !v)}
              >
                <Icon name={reveal ? 'eyeOff' : 'eye'} size={15} />
              </CustomButton>
            </div>
          </div>

          <CustomButton loading={loading} variant="unstyled" type="submit" className="btn btn-primary btn-block h-10">
            Log in
          </CustomButton>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          New to CodeForge?{' '}
          <CustomLink to="/register" className="link text-sm font-medium">
            Create an account
          </CustomLink>
        </p>
      </div>
    </AuthLayout>
  )
}