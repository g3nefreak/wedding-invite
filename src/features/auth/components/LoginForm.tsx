'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { ApiError } from '#/lib/api'
import { loginSchema } from '#/server/validation/login.schema'
import type { LoginInput } from '#/server/validation/login.schema'
import { useLoginMutation } from '../auth.query'

const INPUT =
  'min-h-12 w-full rounded-xl border border-host-line bg-host-panel px-4 py-2 text-lg text-host-ink placeholder:text-host-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent aria-invalid:border-red-300'

export function LoginForm() {
  const router = useRouter()
  const login = useLoginMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  function submit(input: LoginInput) {
    login.mutate(input, {
      onSuccess: () => {
        router.replace('/host')
        router.refresh()
      },
    })
  }

  const serverError =
    login.error instanceof ApiError
      ? login.error.message
      : 'Unable to log in. Check your connection and try again.'

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-lg font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={INPUT}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-300">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-lg font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          className={INPUT}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-red-300">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={login.isPending}
        className="min-h-12 rounded-full bg-host-accent px-6 py-2 text-lg font-medium text-host-accent-ink transition-[background-color,opacity,scale] duration-150 ease-out hover:bg-host-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent enabled:active:scale-[0.96] disabled:opacity-60"
      >
        {login.isPending ? 'Logging in…' : 'Log in'}
      </button>

      {login.isError && (
        <p role="alert" className="text-sm leading-normal text-red-300">
          {serverError}
        </p>
      )}
    </form>
  )
}
