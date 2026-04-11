import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI } from '../services/api';
import { testsAPI } from '../services/api';
import { toast } from 'sonner';
import { Loader2, Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testModal, setTestModal] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await applicationsAPI.getMyApplications();
      setApplications(response.data.items || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (applicationId, jobId) => {
    try {
      setTestLoading(true);
      const response = await testsAPI.startTest(jobId, applicationId);
      setTestModal({
        ...response.data,
        applicationId,
        jobId
      });
      setQuestions(response.data?.test?.questions || response.data?.questions || []);
      setCurrentQuestion(0);
      setAnswers({});
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error(error?.response?.data?.detail || "Testni boshlashda xatolik");
    } finally {
      setTestLoading(false);
    }
  };

  const selectAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitTest = async () => {
    try {
      setSubmitting(true);
      const formattedAnswers = {};
      questions.forEach(q => {
        formattedAnswers[q.id.toString()] = answers[q.id] || '';
      });

      const response = await testsAPI.submitTest(
        testModal.test.id,
        testModal.attempt_id,
        formattedAnswers
      );

      toast.success(`Test yakunlandi! Siz ${response.data.score}% oldingiz`);
      setTestModal(null);
      loadApplications();
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error("Testni topshirishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('uz-UZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  // Filter applications that have tests
  const applicationsWithTests = applications.filter(app => app.job?.has_test);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-[var(--text-main)]">
            Testlar
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Sizga tayinlangan testlar
          </p>
        </div>
      </div>

      {applicationsWithTests.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-main)] p-12 text-center">
          <div className="w-16 h-16 bg-[var(--bg-main)]/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[var(--text-muted)]" />
          </div>
          <h3 className="text-xl font-black text-[var(--text-main)] mb-2">
            Testlar yo'q
          </h3>
          <p className="text-[var(--text-muted)] text-sm">
            Sizga hali hech qanday test tayinlanmagan
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applicationsWithTests.map((app) => (
            <div
              key={app.id}
              className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-main)] p-6 flex items-center justify-between"
            >
              <div>
                <h3 className="font-black text-[var(--text-main)] text-lg">{app.job_title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{app.company}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Ariza topshirilgan: {formatTime(app.applied_at)}
                </p>
              </div>
              <button
                onClick={() => startTest(app.id, app.job_id)}
                disabled={testLoading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm flex items-center gap-2 transition-all"
              >
                {testLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                Testni boshlash
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Test Modal */}
      {testModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setTestModal(null)} />
          <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-main)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[var(--text-main)]">{testModal.test.title}</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    {questions.length} ta savol • {testModal.test.time_limit} daqiqa • {testModal.test.passing_score}% dan o'tish
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--text-muted)]">Savol</p>
                  <p className="text-2xl font-black text-indigo-400">{currentQuestion + 1}/{questions.length}</p>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="flex-1 overflow-y-auto p-6">
              {questions.length > 0 && (
                <div className="space-y-6">
                  <h3 className="font-black text-[var(--text-main)] text-lg">
                    {questions[currentQuestion].question_text}
                  </h3>

                  {questions[currentQuestion].question_type === 'single' && (
                    <div className="space-y-3">
                      {questions[currentQuestion].options?.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectAnswer(questions[currentQuestion].id, option)}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            answers[questions[currentQuestion].id] === option
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                              : 'border-[var(--border-main)] text-[var(--text-main)] hover:border-indigo-500/50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {questions[currentQuestion].question_type === 'text' && (
                    <textarea
                      value={answers[questions[currentQuestion].id] || ''}
                      onChange={(e) => selectAnswer(questions[currentQuestion].id, e.target.value)}
                      placeholder="Javobingizni yozing..."
                      className="w-full h-40 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl p-4 text-[var(--text-main)]"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-card)] flex items-center justify-between">
              <button
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="px-4 py-2 bg-[var(--bg-main)] text-[var(--text-muted)] rounded-xl font-black text-sm disabled:opacity-50"
              >
                Oldingi
              </button>

              <div className="flex gap-2">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full ${
                      idx === currentQuestion 
                        ? 'bg-indigo-500' 
                        : answers[questions[idx]?.id] 
                          ? 'bg-emerald-500' 
                          : 'bg-[var(--border-main)]'
                    }`}
                  />
                ))}
              </div>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={submitTest}
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Topshirish'}
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm"
                >
                  Keyingi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;