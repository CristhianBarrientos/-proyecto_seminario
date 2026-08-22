import { useEffect, useState } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonList, IonItem, IonAvatar, IonLabel, IonBadge, IonIcon,
  IonSearchbar, IonSpinner, IonText,
} from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';
import './Home.css';

interface ServiceFeedItem {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  professional_profiles: {
    profile_id: string;
    is_verified: boolean;
    profiles: { full_name: string } | null;
  } | null;
  categories: { name: string } | null;
}

const Home: React.FC = () => {
  const [services, setServices] = useState<ServiceFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          price,
          price_unit,
          professional_profiles ( profile_id, is_verified, profiles ( full_name ) ),
          categories ( name )
        `)
        .eq('is_active', true);

      if (error) {
        setError(getFriendlyErrorMessage(error));
      } else {
        setServices((data as unknown as ServiceFeedItem[]) ?? []);
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Servicios cerca de ti</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar placeholder="Buscar plomero, electricista..." />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {loading && (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        )}

        {error && (
          <IonText color="danger">
            <p className="ion-padding">{error}</p>
          </IonText>
        )}

        {!loading && !error && services.length === 0 && (
          <IonText color="medium">
            <p className="ion-padding">Todavía no hay servicios publicados.</p>
          </IonText>
        )}

        <IonList>
          {services.map((s) => (
            <IonItem key={s.id} button detail>
              <IonAvatar slot="start">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${s.professional_profiles?.profiles?.full_name ?? '?'}`}
                  alt={s.professional_profiles?.profiles?.full_name ?? 'Profesional'}
                />
              </IonAvatar>
              <IonLabel>
                <h2>{s.professional_profiles?.profiles?.full_name ?? 'Profesional'}</h2>
                <p>{s.title}{s.categories?.name ? ` · ${s.categories.name}` : ''}</p>
                {s.professional_profiles?.is_verified && (
                  <p>
                    <IonIcon icon={checkmarkCircleOutline} color="success" style={{ verticalAlign: 'middle' }} /> Verificado
                  </p>
                )}
              </IonLabel>
              <div slot="end" style={{ textAlign: 'right' }}>
                <IonBadge color="tertiary">Q{s.price}</IonBadge>
                <p style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{s.price_unit}</p>
              </div>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Home;