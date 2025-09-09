'use client';

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, FileCheck, FileUp, Search } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function Home() {
  const { data: session } = useSession();
  const { language } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12">
      <main className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            {language === 'en' 
              ? 'Compliance Document Checklist'
              : 'قائمة التحقق من وثائق الامتثال'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'en'
              ? 'Streamline your compliance process with our intelligent document checklist system. Upload, track, and verify compliance requirements effortlessly.'
              : 'قم بتبسيط عملية الامتثال الخاصة بك مع نظام قائمة التحقق من المستندات الذكي. قم بتحميل متطلبات الامتثال وتتبعها والتحقق منها بسهولة.'}
          </p>
          
          {!session ? (
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/login">
                  {language === 'en' ? 'Get Started' : 'البدء'} 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  {language === 'en' ? 'Go to Dashboard' : 'الذهاب إلى لوحة التحكم'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">
              {language === 'en' ? 'Upload Documents' : 'تحميل المستندات'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'Easily upload your compliance documents for review and verification.'
                : 'قم بتحميل وثائق الامتثال الخاصة بك بسهولة للمراجعة والتحقق.'}
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">
              {language === 'en' ? 'Track Compliance' : 'تتبع الامتثال'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'Monitor your compliance status with interactive checklists and progress tracking.'
                : 'راقب حالة الامتثال الخاصة بك من خلال قوائم المراجعة التفاعلية وتتبع التقدم.'}
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">
              {language === 'en' ? 'Smart Analysis' : 'التحليل الذكي'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'Advanced document analysis to identify and extract compliance requirements automatically.'
                : 'تحليل متقدم للمستندات لتحديد واستخراج متطلبات الامتثال تلقائيًا.'}
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
