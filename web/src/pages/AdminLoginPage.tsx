import { zodResolver } from '@hookform/resolvers/zod'
import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

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

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function AdminLoginPage() {
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

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginForm) {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    })
    if (error) {
      form.setError('root', { message: error.message })
      return
    }
    await queryClient.invalidateQueries({ queryKey: ['session'] })
    navigate(from, { replace: true })
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
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Admin sign in</CardTitle>
          <CardDescription>
            Nucleus Concierge · staff access via Supabase Auth
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!form.formState.errors.password}
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
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
              Sign in
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              New here?{' '}
              <Link
                className="underline-offset-4 hover:text-foreground hover:underline"
                to="/admin/signup"
              >
                Create an admin account
              </Link>
            </p>
            {typeof location.state === 'object' &&
            location.state &&
            'notice' in location.state &&
            typeof (location.state as { notice?: unknown }).notice ===
              'string' ? (
              <p
                className="rounded-md border border-border bg-muted px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground"
                role="status"
              >
                {(location.state as { notice: string }).notice}
              </p>
            ) : null}
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
