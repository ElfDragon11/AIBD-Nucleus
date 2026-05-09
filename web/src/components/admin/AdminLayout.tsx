import type { Session } from '@supabase/supabase-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { Link, Outlet, useOutletContext } from 'react-router-dom'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function AdminLayout() {
  const queryClient = useQueryClient()
  const { session } = useOutletContext<{ session: Session }>()

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })

  return (
    <div className="flex min-h-svh bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
          <p className="truncate text-sm text-muted-foreground">
            Signed in as{' '}
            <span className="font-medium text-foreground">
              {session.user.email ?? session.user.id}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Public site</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={signOutMutation.isPending}
              onClick={() => signOutMutation.mutate()}
            >
              {signOutMutation.isPending ? (
                <>
                  <Loader2Icon
                    className="mr-1 size-3.5 animate-spin"
                    aria-hidden
                  />
                  Signing out…
                </>
              ) : (
                'Sign out'
              )}
            </Button>
          </div>
        </header>
        <main className="min-h-[calc(100svh-3.5rem)] flex-1 overflow-auto bg-background p-6">
          <Outlet context={{ session }} />
        </main>
      </div>
    </div>
  )
}
