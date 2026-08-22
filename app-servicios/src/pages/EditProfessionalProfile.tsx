import { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonItem, IonLabel, IonTextarea, IonInput, IonButton, IonLoading, IonText, IonNote,
} from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';

const EditProfessionalProfile: React.FC = () => {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('professional_profiles')
      .select('bio, service_radius_km')
      .eq('profile_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setError(getFriendlyErrorMessage(error));
          return;
        }
        if (data) {
          setBio(data.bio ?? '');
          setRadius(String(data.service_radius_km ?? 10));
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const payload: Record<string, unknown> = {
      profile_id: user.id,
      bio,
      service_radius_km: Number(radius),
    };

    // Solo mandamos ubicación si el usuario llenó lat/lng
    // Formato EWKT que PostGIS entiende: "SRID=4326;POINT(longitud latitud)"
    // OJO: es longitud primero, luego latitud - al revés de como se suele decir.
    if (lat && lng) {
      payload.location = `SRID=4326;POINT(${lng} ${lat})`;
    }

    const { error } = await supabase
      .from('professional_profiles')
      .upsert(payload, { onConflict: 'profile_id' });

    setLoading(false);

    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }

    setSuccess(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle>Perfil profesional</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Sobre ti / tu experiencia</IonLabel>
          <IonTextarea value={bio} onIonInput={(e) => setBio(e.detail.value!)} autoGrow />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Latitud</IonLabel>
          <IonInput type="number" value={lat} onIonInput={(e) => setLat(e.detail.value!)} placeholder="ej. 14.6349" />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Longitud</IonLabel>
          <IonInput type="number" value={lng} onIonInput={(e) => setLng(e.detail.value!)} placeholder="ej. -90.5231" />
        </IonItem>
        <IonNote className="ion-padding-start">
          Tip: en Google Maps, clic derecho sobre tu ubicación → copia las coordenadas que aparecen arriba.
        </IonNote>

        <IonItem>
          <IonLabel position="stacked">Radio de servicio (km)</IonLabel>
          <IonInput type="number" value={radius} onIonInput={(e) => setRadius(e.detail.value!)} />
        </IonItem>

        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {success && <IonText color="success"><p>Perfil guardado correctamente.</p></IonText>}

        <IonButton expand="block" className="ion-margin-top" onClick={handleSave}>
          Guardar
        </IonButton>

        <IonLoading isOpen={loading} message="Guardando..." />
      </IonContent>
    </IonPage>
  );
};

export default EditProfessionalProfile;
