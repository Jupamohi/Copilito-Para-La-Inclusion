import { Link } from 'react-router';
import type { PropsWithChildren } from 'react';

export function EnlacePrivacidadAcceso({ tipo, children }: PropsWithChildren<{ tipo: 'administrador' | 'retirar' }>) {
  const admin = tipo === 'administrador';
  return (
    <Link className="inline-flex items-center gap-2" to={admin ? '/admin/login' : '/retirar-consentimiento'}>
      <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {admin ? <>
          <path d="m10 2-.6 2.4-2 .9-2.2-1.1-2 3.5 1.8 1.7-.2 2.6-2 1.6 1.9 3.5 2.4-.6 2 1.2.5 2.5h4l.7-2.4 2-1 2.3.8 2-3.5-1.9-1.7v-2.3l1.8-1.8-2-3.5-2.4.8-2-1L14 2Z" />
          <circle cx="12" cy="11.5" r="3.3" />
        </> : <>
          <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />
        </>}
      </svg>
      {children}
    </Link>
  );
}
