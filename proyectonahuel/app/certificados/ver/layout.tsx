'use client';

export default function CertificateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-container, .print-container * {
            visibility: visible;
          }
          
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
          }
        }
      `}</style>
      <div className="print-container">
        {children}
      </div>
    </div>
  );
} 