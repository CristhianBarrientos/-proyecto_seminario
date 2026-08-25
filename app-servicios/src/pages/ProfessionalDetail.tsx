import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonList, IonItem, IonLabel, IonBadge, IonIcon, IonText, IonSpinner, IonAvatar,
} from '@ionic/react';
import { checkmarkCircleOutline, starSharp } from 'ionicons/icons';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';

interface ServiceItem {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  categories: { name: string } | null;
}

interface ProfessionalData {
  profile_id: string;
  bio: string | null;
  is_verified: boolean;
  profiles: { full_name: string } | null;
}

interface RatingData {
  rating_avg: number;
  rating_count: number;
}

const ProfessionalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [professional, setProfessional] = useState<ProfessionalData | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [rating, setRating] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const [profResult, servicesResult, ratingResult] = await Promise.all([
        supabase
          .from('professional_profiles')
          .select('profile_id, bio, is_verified, profiles ( full_name )')
          .eq('profile_id', id)
          .single(),
        supabase
          .from('services')
          .select('id, title, price, price_unit, categories ( name )')
          .eq('professional_id', id)
          .eq('is_active', true),
        supabase
          .from('professional_ratings')
          .select('rating_avg, rating_count')
          .eq('professional_id', id)
          .maybeSingle(),
      ]);

      if (profResult.error) {
        setError(getFriendlyErrorMessage(profResult.error));
        setLoading(false);
        return;
      }

      setProfessional(profResult.data as unknown as ProfessionalData);
      setServices((servicesResult.data as unknown as ServiceItem[]) ?? []);
      setRating(ratingResult.data as RatingData | null);
      setLoading(false);
    };

    load();
  }, [id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle>Perfil del profesional</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading && (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        )}

        {error && <IonText color="danger"><p>{error}</p></IonText>}

        {!loading && professional && (
          <>
            <IonItem lines="none">
              <IonAvatar slot="start">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${professional.profiles?.full_name ?? '?'}`}
                  alt={professional.profiles?.full_name ?? 'Profesional'}
                />
              </IonAvatar>
              <IonLabel>
                <h1>{professional.profiles?.full_name ?? 'Profesional'}</h1>
                {professional.is_verified && (
                  <p>
                    <IonIcon icon={checkmarkCircleOutline} color="tertiary" style={{ verticalAlign: 'middle' }} /> Verificado
                  </p>
                )}
                {rating && rating.rating_count > 0 && (
                  <p>
                    <IonIcon icon={starSharp} color="secondary" style={{ verticalAlign: 'middle' }} /> {rating.rating_avg} ({rating.rating_count} reseñas)
                  </p>
                )}
              </IonLabel>
            </IonItem>

            {professional.bio && (
              <IonText>
                <p className="ion-padding-horizontal">{professional.bio}</p>
              </IonText>
            )}

            <IonItem lines="none" className="ion-margin-top">
              <IonLabel><h2>Servicios</h2></IonLabel>
            </IonItem>

            <IonList>
              {services.map((s) => (
                <IonItem key={s.id}>
                  <IonLabel>
                    <h3>{s.title}</h3>
                    <p>{s.categories?.name}</p>
                  </IonLabel>
                  <IonBadge color="secondary" slot="end">Q{s.price} / {s.price_unit}</IonBadge>
                </IonItem>
              ))}
              {services.length === 0 && (
                <IonText color="medium">
                  <p className="ion-padding">Sin servicios activos por ahora.</p>
                </IonText>
              )}
            </IonList>

            <IonText color="medium">
              <p className="ion-padding-horizontal">
                El botón "Solicitar servicio" llega en la Fase 5 (bookings).
              </p>
            </IonText>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ProfessionalDetail;
