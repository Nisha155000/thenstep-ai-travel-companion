import React from 'react';
import { Footprints, Bus, Train, Car, Bike, AlertCircle, Database, CheckCircle2 } from 'lucide-react';
import { RouteStep } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface RouteTimelineProps {
  steps: RouteStep[];
  limitations: string[];
  dataSource: string;
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({ steps, limitations, dataSource }) => {
  const { language, t } = useTranslation();

  const getStepIcon = (mode: string) => {
    switch (mode) {
      case 'walk':
        return <Footprints className="w-4 h-4 text-emerald-600" />;
      case 'bus':
        return <Bus className="w-4 h-4 text-sky-600" />;
      case 'metro':
      case 'train':
        return <Train className="w-4 h-4 text-tealbrand-600" />;
      case 'auto':
      case 'cab':
        return <Car className="w-4 h-4 text-amber-600" />;
      case 'bike':
        return <Bike className="w-4 h-4 text-orange-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-step-600" />;
    }
  };

  const getLocalizedInstruction = (step: RouteStep) => {
    if (language === 'kn' && step.instruction_kn) return step.instruction_kn;
    if (language === 'hi' && step.instruction_hi) return step.instruction_hi;
    return step.instruction;
  };

  return (
    <div className="space-y-4">
      <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
        {t('timeline.title')}
      </h5>

      {/* Step Sequence */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => (
          <div key={idx} className="relative group">
            {/* Dot / Icon */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-step-500 flex items-center justify-center shadow-xs">
              {getStepIcon(step.mode)}
            </div>

            {/* Content */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold text-slate-800">
                  Step {step.step_number}: {step.mode.toUpperCase()}
                </span>
                <span>
                  ~{step.duration_minutes} min ({step.distance_meters > 1000 ? `${(step.distance_meters / 1000).toFixed(1)} km` : `${step.distance_meters} m`})
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                {getLocalizedInstruction(step)}
              </p>

              {step.frequency_notes && (
                <div className="text-[11px] text-tealbrand-700 mt-1 font-medium">
                  ⏱ {step.frequency_notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Limitations & Data Freshness */}
      <div className="pt-2 space-y-2">
        {limitations.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-800 space-y-1">
            <div className="font-bold flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Important Limitations & Cautions:
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              {limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-[11px] text-slate-400 flex items-center space-x-1 pl-1">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>Data Source: {dataSource}</span>
        </div>
      </div>
    </div>
  );
};
