import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PdfUpload } from '@/components/pdf/pdf-upload';
import { LanguageSwitcher } from '@/components/language-switcher';

export default async function UploadPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Upload Document</h1>
          <LanguageSwitcher />
        </header>

        <PdfUpload />
      </div>
    </div>
  );
}