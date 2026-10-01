import { useState } from 'react'
import { AuthLayout, AuthShowcase } from './AuthLayout'
import { Icon } from '../../components/icons'
import { LOGIN_SHOWCASE } from '../../data'
import { CodeWindow } from '../../components/Code'
import CustomButton from '../../components/ui/CustomButton'
import CustomLink from '../../components/ui/CustomLink'
import { useAppForm } from '../../hooks/useAppForm'
import useLogin, { loginSchema, type LoginFormSchema } from '../../hooks/auth/login/useLogin'
import CustomInput from '../../components/ui/CustomInput';


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
      } catch (error: unknown) {

      }
    }
  });

  return (
    <AuthLayout showcase={showcase}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="t-page-title text-ink">Log in</h1>
          <p className="t-reading text-ink-2">Enter your details to access your account.</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="t-ui-med text-ink" htmlFor="login-email">
              Email
            </label>
            <CustomInput
              id="login-email"
              className="input h-10"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              register={register('email')}
              error={errors?.email?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="t-ui-med text-ink" htmlFor="login-password">
                Password
              </label>
              <CustomLink to="/forgot-password" className="link t-caption">
                Forgot password?
              </CustomLink>
            </div>
            <div className="relative">
              <CustomInput
                id="login-password"
                className="input h-10 pr-11"
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

        <p className="t-ui text-center text-ink-2">
          New to CodeForge?{' '}
          <CustomLink to="/register" className="link t-ui-med">
            Create an account
          </CustomLink>
        </p>
      </div>
    </AuthLayout>
  )
}