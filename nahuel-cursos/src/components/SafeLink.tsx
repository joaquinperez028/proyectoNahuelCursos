'use client';

import React from 'react';
import Link from 'next/link';

interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
  id?: string;
  title?: string;
  prefetch?: boolean;
}

/**
 * Componente de enlace seguro que previene problemas de navegación comunes
 * y asegura que los hipervínculos funcionen correctamente
 */
export default function SafeLink({
  href,
  children,
  className = '',
  onClick,
  target,
  rel,
  id,
  title,
  prefetch = false,
}: SafeLinkProps) {
  // Asegurarse de que href sea siempre una cadena válida
  const safeHref = React.useMemo(() => {
    if (!href) return '/';
    
    // Si es una URL externa, dejarla como está
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }
    
    // Si no comienza con /, añadirlo
    if (!href.startsWith('/')) {
      return `/${href}`;
    }
    
    return href;
  }, [href]);
  
  // Manejar el evento de clic
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si hay un controlador de clic personalizado, ejecutarlo
    if (onClick) {
      onClick(e);
      return;
    }
    
    // Para enlaces externos, permitir el comportamiento predeterminado
    if (target === '_blank' || safeHref.startsWith('http')) {
      return;
    }
    
    // Para enlaces internos, evitar comportamiento predeterminado si tenemos problemas
    // y manejar la navegación manualmente
    if (typeof window !== 'undefined' && window.location.pathname === safeHref) {
      e.preventDefault();
      // Opcional: refrescar la página si el enlace es a la misma página
      window.location.reload();
    }
  };
  
  // Definir atributos rel seguros para enlaces externos
  const safeRel = React.useMemo(() => {
    if (target === '_blank') {
      return rel || 'noopener noreferrer';
    }
    return rel;
  }, [target, rel]);
  
  return (
    <Link 
      href={safeHref}
      className={className}
      onClick={handleClick}
      target={target}
      rel={safeRel}
      id={id}
      title={title}
      prefetch={prefetch}
      data-original-href={href} // Guardar la href original para depuración
    >
      {children}
    </Link>
  );
} 