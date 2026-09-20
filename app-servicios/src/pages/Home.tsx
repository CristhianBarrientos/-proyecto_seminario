import { useEffect, useMemo, useState } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonList, IonItem, IonAvatar, IonLabel, IonBadge, IonIcon,
  IonSearchbar, IonSpinner, IonText, IonSelect, IonSelectOption,
} from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';
import './Home.css';

interface ServiceFeedItem {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  category_id: number;
  professional_id: string;
  professional_profiles: {
    profile_id: string;
    is_verified: boolean;
    profiles: { full_name: string } | null;
  } | null;
  categories: { name: string } | null;
}

interface Category {
  id: number;
  name: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceFeedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // professional_profiles/profiles ya no son legibles para terceros (RLS: solo el
      // dueño ve su propia fila) - el feed público lee de las vistas *_public en vez de
      // depender del embed anidado de PostgREST, que no atraviesa esa restricción.
      const [servicesResult, categoriesResult] = await Promise.all([
        supabase
          .from('services')
          .select('id, title, price, price_unit, category_id, professional_id, categories ( name )')
          .eq('is_active', true),
        supabase.from('categories').select('id, name'),
      ]);

      if (servicesResult.error) {
        setError(getFriendlyErrorMessage(servicesResult.error));
        setLoading(false);
        return;
      }

      const rawServices = servicesResult.data ?? [];
      const professionalIds = [...new Set(rawServices.map((s) => s.professional_id))];

      const [profProfilesResult, profilesResult] = professionalIds.length
        ? await Promise.all([
            supabase
              .from('professional_profiles_public')
              .select('profile_id, is_verified')
              .in('profile_id', professionalIds),
            supabase
              .from('profiles_public')
              .select('id, full_name')
              .in('id', professionalIds),
          ])
        : [{ data: [] }, { data: [] }];

      const isVerifiedById = new Map((profProfilesResult.data ?? []).map((p) => [p.profile_id, p.is_verified]));
      const nameById = new Map((profilesResult.data ?? []).map((p) => [p.id, p.full_name]));

      const merged: ServiceFeedItem[] = rawServices.map((s) => ({
        ...s,
        professional_profiles: {
          profile_id: s.professional_id,
          is_verified: isVerifiedById.get(s.professional_id) ?? false,
          profiles: nameById.has(s.professional_id)
            ? { full_name: nameById.get(s.professional_id)! }
            : null,
        },
      }));

      setServices(merged);
      setCategories(categoriesResult.data ?? []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredServices = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    return services.filter((s) => {
      const matchesCategory = categoryFilter === 'all' || s.category_id === Number(categoryFilter);
      const matchesText = text
        ? s.title.toLowerCase().includes(text) ||
          (s.professional_profiles?.profiles?.full_name?.toLowerCase().includes(text) ?? false) ||
          (s.categories?.name?.toLowerCase().includes(text) ?? false)
        : true;
      return matchesCategory && matchesText;
    });
  }, [services, searchText, categoryFilter]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Servicios cerca de ti</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            placeholder="Buscar plomero, electricista..."
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value ?? '')}
          />
        </IonToolbar>
        <IonToolbar>
          <IonSelect
            interface="popover"
            value={categoryFilter}
            onIonChange={(e) => setCategoryFilter(e.detail.value)}
            className="ion-padding-start"
          >
            <IonSelectOption value="all">Todas las categorías</IonSelectOption>
            {categories.map((c) => (
              <IonSelectOption key={c.id} value={String(c.id)}>{c.name}</IonSelectOption>
            ))}
          </IonSelect>
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

        {!loading && !error && filteredServices.length === 0 && (
          <IonText color="medium">
            <p className="ion-padding">No hay servicios que coincidan con tu búsqueda.</p>
          </IonText>
        )}

        <IonList>
          {filteredServices.map((s) => (
            <IonItem
              key={s.id}
              button
              detail
              onClick={() => {
                if (s.professional_profiles?.profile_id) {
                  navigate(`/tabs/home/${s.professional_profiles.profile_id}`);
                }
              }}
            >
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
                    <IonIcon icon={checkmarkCircleOutline} color="tertiary" style={{ verticalAlign: 'middle' }} /> Verificado
                  </p>
                )}
              </IonLabel>
              <div slot="end" style={{ textAlign: 'right' }}>
                <IonBadge color="secondary">Q{s.price}</IonBadge>
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