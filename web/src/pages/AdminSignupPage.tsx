import { zodResolver } from '@hookform/resolvers/zod'
import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { BrandMark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

const signupSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords must match',
        path: ['confirmPassword'],
      })
    }
  })

type SignupForm = z.infer<typeof signupSchema>

export function AdminSignupPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  const from =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : '/admin'

  const { data: session, isFetched } = useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session
    },
  })

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: SignupForm) {
    const { error, data } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
    })
    if (error) {
      form.setError('root', { message: error.message })
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['session'] })

    if (data.session) {
      navigate(from, { replace: true })
      return
    }

    navigate('/admin/login', {
      replace: true,
      state: {
        notice:
          'If email confirmation is required, confirm your inbox then sign in. Otherwise you can sign in now.',
      },
    })
  }

  if (!isFetched) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }
  if (session) return <Navigate to="/admin" replace />

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-secondary px-4 py-10">
      <BrandMark className="mb-8" />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create admin account</CardTitle>
          <CardDescription>
            Interim MVP: every new signup is granted access as an admin staff user.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            {form.formState.errors.root?.message ? (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive"
                role="alert"
              >
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!form.formState.errors.email}
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!form.formState.errors.password}
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-confirm">Confirm password</Label>
              <Input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!form.formState.errors.confirmPassword}
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Create account
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link
                className="underline-offset-4 hover:text-foreground hover:underline"
                to="/admin/login"
              >
                Sign in
              </Link>
            </p>
            <Link
              className="text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
              to="/"
            >
              ← Back to concierge home
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
