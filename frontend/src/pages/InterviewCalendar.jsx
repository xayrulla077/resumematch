import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { interviewAPI } from '../lib/api';

const InterviewCalendar = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const response = await interviewAPI.getMyInterviews();
      if (response.data) {
        setInterviews(response.data);
      }
    } catch (error) {
      console.error('Load interviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i)
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i)
      });
    }
    
    return days;
  };

  const getInterviewsForDate = (date) => {
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduled_at);
      return interviewDate.toDateString() === date.toDateString();
    });
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)]">
              {t('interview_calendar') || 'Interview Calendar'}
            </h1>
            <p className="text-[var(--text-muted)] font-medium">
              {t('schedule_subtitle') || 'View and manage your scheduled interviews'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl font-bold transition-colors ${
              viewMode === 'calendar' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
            }`}
          >
            <Calendar className="w-5 h-5 inline-block mr-2" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl font-bold transition-colors ${
              viewMode === 'list' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
            }`}
          >
            <CheckCircle className="w-5 h-5 inline-block mr-2" />
            List
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={prevMonth}
                  className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-main)] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-black text-[var(--text-main)]">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={nextMonth}
                  className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-main)] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-indigo-600/10 text-indigo-500 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
              >
                {t('today') || 'Today'}
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-bold text-[var(--text-muted)] py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayInterviews = getInterviewsForDate(day.fullDate);
                const isToday = day.fullDate.toDateString() === today.toDateString();
                const isSelected = selectedDate && day.fullDate.toDateString() === selectedDate.toDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day.fullDate)}
                    className={`relative p-2 rounded-xl transition-all min-h-[80px] ${
                      !day.isCurrentMonth 
                        ? 'opacity-30' 
                        : 'hover:bg-[var(--bg-main)]'
                    } ${isToday ? 'bg-indigo-600/20 border border-indigo-500' : ''} ${
                      isSelected ? 'bg-indigo-600/30 border-2 border-indigo-500' : ''
                    } border border-transparent`}
                  >
                    <span className={`text-sm font-bold ${
                      isToday ? 'text-indigo-500' : day.isCurrentMonth ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'
                    }`}>
                      {day.date}
                    </span>
                    
                    {dayInterviews.length > 0 && (
                      <div className="absolute bottom-1 left-1 right-1 flex gap-1 justify-center">
                        {dayInterviews.slice(0, 3).map((interview, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full ${
                              interview.status === 'scheduled' 
                                ? 'bg-green-500' 
                                : interview.status === 'completed' 
                                  ? 'bg-blue-500' 
                                  : 'bg-red-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
            <h3 className="text-xl font-black text-[var(--text-main)] mb-4">
              {selectedDate ? formatDate(selectedDate) : t('select_date') || 'Select a date'}
            </h3>
            
            {selectedDate ? (
              getInterviewsForDate(selectedDate).length > 0 ? (
                <div className="space-y-4">
                  {getInterviewsForDate(selectedDate).map((interview, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-main)]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-[var(--text-main)]">{interview.job_title}</h4>
                        <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                          interview.status === 'scheduled' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {interview.status}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)] mb-2">{interview.company}</p>
                      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(interview.scheduled_at)} ({interview.duration_minutes} min)
                        </span>
                      </div>
                      {interview.meeting_link && (
                        <a 
                          href={interview.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-2 text-indigo-500 font-bold text-sm hover:underline"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-center py-8">
                  {t('no_interviews') || 'No interviews scheduled for this day'}
                </p>
              )
            ) : (
              <p className="text-[var(--text-muted)] text-center py-8">
                {t('click_date') || 'Click on a date to view interviews'}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
          {interviews.length > 0 ? (
            <div className="space-y-4">
              {interviews
                .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                .map((interview, index) => (
                  <div 
                    key={index}
                    className="p-6 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-main)] hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-black text-[var(--text-main)]">{interview.job_title}</h4>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            interview.status === 'scheduled' 
                              ? 'bg-green-500/20 text-green-500' 
                              : interview.status === 'completed'
                                ? 'bg-blue-500/20 text-blue-500'
                                : 'bg-red-500/20 text-red-500'
                          }`}>
                            {interview.status}
                          </span>
                        </div>
                        <p className="text-[var(--text-muted)] font-medium mb-4">{interview.company}</p>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <span className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Calendar className="w-4 h-4" />
                            {formatDate(interview.scheduled_at)}
                          </span>
                          <span className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Clock className="w-4 h-4" />
                            {formatTime(interview.scheduled_at)} ({interview.duration_minutes} min)
                          </span>
                        </div>
                      </div>
                      
                      {interview.meeting_link && interview.status === 'scheduled' && (
                        <a 
                          href={interview.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)] mb-2">
                {t('no_interviews_scheduled') || 'No Interviews Scheduled'}
              </h3>
              <p className="text-[var(--text-muted)]">
                {t('no_interviews_message') || 'Your scheduled interviews will appear here'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)] font-medium">{t('scheduled') || 'Scheduled'}</p>
              <p className="text-2xl font-black text-[var(--text-main)]">
                {interviews.filter(i => i.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)] font-medium">{t('completed') || 'Completed'}</p>
              <p className="text-2xl font-black text-[var(--text-main)]">
                {interviews.filter(i => i.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)] font-medium">{t('cancelled') || 'Cancelled'}</p>
              <p className="text-2xl font-black text-[var(--text-main)]">
                {interviews.filter(i => i.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCalendar;