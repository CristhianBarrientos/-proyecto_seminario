import { useEffect, useState } from 'react';
import { IonSpinner, IonText } from '@ionic/react';
import { supabase } from '../lib/supabaseClient';
import './ProfessionalDashboard.css';

interface Props {
  userId: string;
}

type BookingStatus = 'solicitado' | 'aceptado' | 'en_curso' | 'completado' | 'cancelado';

const STATUS_ORDER: { status: BookingStatus; label: string; color: string }[] = [
  { status: 'solicitado', label: 'Solicitado', color: 'var(--ion-color-warning)' },
  { status: 'aceptado', label: 'Aceptado', color: 'var(--ion-color-tertiary)' },
  { status: 'en_curso', label: 'En curso', color: 'var(--ion-color-secondary)' },
  { status: 'completado', label: 'Completado', color: 'var(--ion-color-success)' },
  { status: 'cancelado', label: 'Cancelado', color: 'var(--ion-color-danger)' },
];

const ProfessionalDashboard: React.FC<Props> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [rankPosition, setRankPosition] = useState<number | null>(null);
  const [rankTotal, setRankTotal] = useState(0);
  const [activeServices, setActiveServices] = useState(0);
  const [countByStatus, setCountByStatus] = useState<Record<BookingStatus, number>>({
    solicitado: 0,
    aceptado: 0,
    en_curso: 0,
    completado: 0,
    cancelado: 0,
  });
  const [ingresosAprox, setIngresosAprox] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [ownRatingResult, allRatingsResult, servicesResult, bookingsResult] = await Promise.all([
        supabase
          .from('professional_ratings')
          .select('rating_avg, rating_count')
          .eq('professional_id', userId)
          .maybeSingle(),
        supabase
          .from('professional_ratings')
          .select('professional_id, rating_avg')
          .order('rating_avg', { ascending: false }),
        supabase
          .from('services')
          .select('id')
          .eq('professional_id', userId)
          .eq('is_active', true),
        supabase
          .from('bookings')
          .select('status, price_agreed')
          .eq('professional_id', userId),
      ]);

      setRatingAvg(ownRatingResult.data?.rating_avg ?? null);
      setRatingCount(ownRatingResult.data?.rating_count ?? 0);

      const ranked = allRatingsResult.data ?? [];
      setRankTotal(ranked.length);
      const position = ranked.findIndex((r) => r.professional_id === userId);
      setRankPosition(position >= 0 ? position + 1 : null);

      setActiveServices(servicesResult.data?.length ?? 0);

      const bookings = bookingsResult.data ?? [];
      const counts: Record<BookingStatus, number> = {
        solicitado: 0,
        aceptado: 0,
        en_curso: 0,
        completado: 0,
        cancelado: 0,
      };
      let ingresos = 0;
      for (const b of bookings) {
        counts[b.status as BookingStatus] += 1;
        if (b.status === 'completado' && b.price_agreed) {
          ingresos += b.price_agreed;
        }
      }
      setCountByStatus(counts);
      setIngresosAprox(ingresos);

      setLoading(false);
    };

    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="ion-text-center ion-padding">
        <IonSpinner />
      </div>
    );
  }

  const totalSolicitudes = Object.values(countByStatus).reduce((a, b) => a + b, 0);
  const hasIngresos = ingresosAprox > 0;
  const hasRanking = ratingCount > 0 && rankPosition !== null;

  // Métrica principal: la más relevante según el estado real del profesional -
  // mostrar "Q0 de ingresos" a alguien sin tratos cerrados no aporta nada.
  const heroMetric = hasIngresos
    ? {
        value: `Q${ingresosAprox.toLocaleString('es-GT')}`,
        label: 'Ingresos aproximados (tratos completados)',
      }
    : hasRanking
    ? {
        value: `Top ${rankPosition}`,
        label: `de ${rankTotal} profesionales con reseñas`,
      }
    : {
        value: `${totalSolicitudes}`,
        label: totalSolicitudes > 0 ? 'Solicitudes recibidas' : 'Aún no tenés solicitudes',
      };

  const maxCount = Math.max(...Object.values(countByStatus), 1);

  return (
    <div className="pro-dashboard">
      <p className="pro-dashboard__title">Tu panel</p>

      <div className="pro-dashboard__hero">
        <div>
          <div className="pro-dashboard__hero-value">{heroMetric.value}</div>
          <div className="pro-dashboard__hero-label">{heroMetric.label}</div>
        </div>
      </div>

      <div className="pro-dashboard__stats">
        <div className="pro-dashboard__stat">
          <div className="pro-dashboard__stat-value">
            {ratingCount > 0 ? ratingAvg : '—'}
          </div>
          <div className="pro-dashboard__stat-label">
            {ratingCount > 0 ? `${ratingCount} reseña${ratingCount === 1 ? '' : 's'}` : 'Sin reseñas'}
          </div>
        </div>
        <div className="pro-dashboard__stat">
          <div className="pro-dashboard__stat-value">{activeServices}</div>
          <div className="pro-dashboard__stat-label">Servicios activos</div>
        </div>
        <div className="pro-dashboard__stat">
          <div className="pro-dashboard__stat-value">{totalSolicitudes}</div>
          <div className="pro-dashboard__stat-label">Solicitudes totales</div>
        </div>
      </div>

      <div className="pro-dashboard__chart">
        <p className="pro-dashboard__chart-title">Solicitudes por estado</p>
        {totalSolicitudes === 0 ? (
          <IonText color="medium">
            <p className="pro-dashboard__empty">
              Todavía no recibiste solicitudes. Cuando un cliente te contacte, vas a ver el detalle acá.
            </p>
          </IonText>
        ) : (
          STATUS_ORDER.map(({ status, label, color }) => (
            <div className="pro-dashboard__bar-row" key={status}>
              <span className="pro-dashboard__bar-label">{label}</span>
              <div className="pro-dashboard__bar-track">
                <div
                  className="pro-dashboard__bar-fill"
                  style={{
                    width: `${(countByStatus[status] / maxCount) * 100}%`,
                    background: color,
                  }}
                />
              </div>
              <span className="pro-dashboard__bar-count">{countByStatus[status]}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
