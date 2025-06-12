// src/app/admin/questionnaires/[questionnaireId]/edit/page.tsx

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import QuestionnaireSettings from '@/components/admin/QuestionnaireSettings';

interface PageParams {
  questionnaireId: string;
}

export default async function EditQuestionnairePage({ params }: { params: PageParams }) {
  const { questionnaireId: qIdStr } = await params;
  const questionnaireId = Number(qIdStr);

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return redirect('/login');

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: questionnaire, error } = await supabase
    .from('questionnaires')
    .select('id, title, description, goal, result, use_ai_analysis')
    .eq('id', questionnaireId)
    .single();
  if (error || !questionnaire) {
    return notFound();
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Редактировать анкету</h1>
      <form
        action={async (formData: FormData) => {
          'use server';
          const title = formData.get('title')?.toString() || '';
          const description = formData.get('description')?.toString() || '';
          const goal = formData.get('goal')?.toString() || '';
          const result = formData.get('result')?.toString() || '';
          await supabase
            .from('questionnaires')
            .update({ title, description, goal, result })
            .eq('id', questionnaireId);
          redirect(`/admin/questionnaires/${questionnaireId}`);
        }}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        {/* Fields for title, description, goal, result */}
        <div>
          <label className="block font-medium">Название анкеты</label>
          <input
            name="title"
            defaultValue={questionnaire.title}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Описание</label>
          <textarea
            name="description"
            defaultValue={questionnaire.description || ''}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Цель анкеты</label>
          <textarea
            name="goal"
            defaultValue={questionnaire.goal || ''}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Результат</label>
          <textarea
            name="result"
            defaultValue={questionnaire.result || ''}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Сохранить
        </button>
      </form>

      <QuestionnaireSettings questionnaireId={questionnaireId} />
    </div>
  );
}
