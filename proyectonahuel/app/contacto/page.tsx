'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Límite de intentos de envío por sesión
const MAX_SUBMISSION_ATTEMPTS = 5;
const SUBMISSION_TIMEOUT = 60000; // 1 minuto

export default function ContactoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: '',
    honeypot: '', // Campo trampa para bots
  });
  const [errors, setErrors] = useState({
    email: '',
    subject: '',
    message: '',
    general: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: string;
    error?: string;
  }>({});

  // Referencias para control anti-spam
  const submissionCount = useRef(0);
  const lastSubmissionTime = useRef(0);
  
  // Valida y sanitiza la entrada
  const sanitizeInput = (input: string): string => {
    // Elimina etiquetas HTML y caracteres potencialmente peligrosos
    return input
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/[&<>"'`=\/]/g, "");
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      subject: '',
      message: '',
      general: '',
    };

    // Control anti-spam: verificación de tiempo entre envíos
    const now = Date.now();
    if (now - lastSubmissionTime.current < SUBMISSION_TIMEOUT && lastSubmissionTime.current !== 0) {
      newErrors.general = `Por favor, espera un momento antes de enviar otro mensaje`;
      isValid = false;
    }

    // Control anti-spam: verificación de número de intentos
    if (submissionCount.current >= MAX_SUBMISSION_ATTEMPTS) {
      newErrors.general = `Has alcanzado el límite de mensajes enviados`;
      isValid = false;
    }

    // Honeypot: Si se completó, probablemente es un bot
    if (formData.honeypot) {
      // No mostramos error para no alertar al bot
      console.log('Intento de spam detectado (honeypot)');
      return false;
    }

    // Validar email
    if (!formData.email) {
      newErrors.email = 'El email es obligatorio';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
      isValid = false;
    }

    // Validar asunto - sanitizamos y verificamos longitud
    const sanitizedSubject = sanitizeInput(formData.subject);
    if (!sanitizedSubject) {
      newErrors.subject = 'El asunto es obligatorio';
      isValid = false;
    } else if (sanitizedSubject.length < 5) {
      newErrors.subject = 'El asunto debe tener al menos 5 caracteres';
      isValid = false;
    } else if (sanitizedSubject.length > 100) {
      newErrors.subject = 'El asunto no debe exceder los 100 caracteres';
      isValid = false;
    }

    // Validar mensaje - sanitizamos y verificamos longitud
    const sanitizedMessage = sanitizeInput(formData.message);
    if (!sanitizedMessage) {
      newErrors.message = 'El mensaje es obligatorio';
      isValid = false;
    } else if (sanitizedMessage.length < 10) {
      newErrors.message = 'El mensaje debe tener al menos 10 caracteres';
      isValid = false;
    } else if (sanitizedMessage.length > 1000) {
      newErrors.message = 'El mensaje no debe exceder los 1000 caracteres';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({});

    try {
      // Actualiza el contador de envíos
      submissionCount.current += 1;
      lastSubmissionTime.current = Date.now();

      // Sanitiza los datos antes de enviarlos
      const sanitizedData = {
        email: formData.email.trim(),
        subject: sanitizeInput(formData.subject),
        message: sanitizeInput(formData.message),
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error al enviar el mensaje');
      }

      // Éxito
      setSubmitStatus({ success: '¡Mensaje enviado correctamente! Nos pondremos en contacto contigo pronto.' });
      setFormData({
        email: '',
        subject: '',
        message: '',
        honeypot: '',
      });

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
      console.error('Error en formulario de contacto:', error);
      setSubmitStatus({ error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-24 px-4 bg-[var(--background)]">
      <div className="max-w-3xl mx-auto bg-[var(--card)] rounded-lg overflow-hidden shadow-xl">
        <div className="p-6 md:p-8 lg:p-10">
          <h1 className="text-3xl font-bold mb-6 text-[var(--foreground)] bg-gradient-to-r from-[var(--primary-light)] to-[var(--accent)] bg-clip-text text-transparent">
            Contacto
          </h1>
          <p className="mb-8 text-[var(--neutral-300)]">
            Completa el formulario a continuación y nos pondremos en contacto contigo lo antes posible.
          </p>

          {submitStatus.success && (
            <div className="bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] px-4 py-3 rounded-md mb-6">
              {submitStatus.success}
            </div>
          )}

          {submitStatus.error && (
            <div className="bg-[var(--error-light)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-md mb-6">
              <p className="font-medium">{submitStatus.error}</p>
            </div>
          )}

          {errors.general && (
            <div className="bg-[var(--error-light)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-md mb-6">
              <p className="font-medium">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo honeypot oculto para detectar bots */}
            <div className="opacity-0 absolute top-0 left-0 h-0">
              <label className="hidden">No completar este campo</label>
              <input
                type="text"
                name="honeypot"
                value={formData.honeypot}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--neutral-300)] mb-2">
                Email <span className="text-[var(--error)]">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                maxLength={100}
                className={`w-full px-4 py-3 bg-[var(--neutral-900)] border ${
                  errors.email ? 'border-[var(--error)]' : 'border-[var(--border)]'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)]`}
                placeholder="tu-email@ejemplo.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-[var(--error)]">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-[var(--neutral-300)] mb-2">
                Asunto <span className="text-[var(--error)]">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                maxLength={100}
                className={`w-full px-4 py-3 bg-[var(--neutral-900)] border ${
                  errors.subject ? 'border-[var(--error)]' : 'border-[var(--border)]'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)]`}
                placeholder="Asunto de tu mensaje"
                disabled={isSubmitting}
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-[var(--error)]">{errors.subject}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-[var(--neutral-300)] mb-2">
                Descripción <span className="text-[var(--error)]">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                maxLength={1000}
                className={`w-full px-4 py-3 bg-[var(--neutral-900)] border ${
                  errors.message ? 'border-[var(--error)]' : 'border-[var(--border)]'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)]`}
                placeholder="Escribe tu mensaje aquí..."
                disabled={isSubmitting}
              />
              {errors.message && (
                <p className="mt-1 text-sm text-[var(--error)]">{errors.message}</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-6 py-3 bg-[var(--primary)] text-white rounded-md 
                  hover:bg-[var(--primary-dark)] transition-colors focus:outline-none focus:ring-2 
                  focus:ring-[var(--primary-light)] focus:ring-offset-2 focus:ring-offset-[var(--background)]
                  ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </div>
          </form>
          
          <div className="mt-10 pt-6 border-t border-[var(--border)] text-center text-[var(--neutral-400)] text-sm">
            <p>También puedes seguirnos en nuestras redes sociales</p>
            <div className="flex justify-center space-x-4 mt-3">
              <a href="https://x.com/lozanonahuelok" target="_blank" rel="noopener noreferrer" 
                className="text-[var(--neutral-300)] hover:text-[var(--primary)] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/lozanonahuel" target="_blank" rel="noopener noreferrer" 
                className="text-[var(--neutral-300)] hover:text-[var(--primary)] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://www.youtube.com/@LozanoNahuel" target="_blank" rel="noopener noreferrer" 
                className="text-[var(--neutral-300)] hover:text-[var(--primary)] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@lozanonahuelok" target="_blank" rel="noopener noreferrer" 
                className="text-[var(--neutral-300)] hover:text-[var(--primary)] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 