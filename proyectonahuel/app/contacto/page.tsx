'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: string;
    error?: string;
  }>({});

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      subject: '',
      message: '',
    };

    // Validar email
    if (!formData.email) {
      newErrors.email = 'El email es obligatorio';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
      isValid = false;
    }

    // Validar asunto
    if (!formData.subject) {
      newErrors.subject = 'El asunto es obligatorio';
      isValid = false;
    } else if (formData.subject.length < 5) {
      newErrors.subject = 'El asunto debe tener al menos 5 caracteres';
      isValid = false;
    }

    // Validar mensaje
    if (!formData.message) {
      newErrors.message = 'El mensaje es obligatorio';
      isValid = false;
    } else if (formData.message.length < 10) {
      newErrors.message = 'El mensaje debe tener al menos 10 caracteres';
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
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
      });

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
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
              {submitStatus.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
        </div>
      </div>
    </div>
  );
} 