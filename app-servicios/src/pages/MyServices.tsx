import { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton,
  IonIcon, IonText, IonLoading, IonToggle,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';

interface Category {
  id: number;
  name: string;
}

interface ServiceRow {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  is_active: boolean;
  category_id: number;
}

const MyServices: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('servicio');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadServices = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('services')
      .select('id, title, price, price_unit, is_active, category_id')
      .eq('professional_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }
    setServices(data ?? []);
  };

  useEffect(() => {
    supabase.from('categories').select('id, name').then(({ data, error }) => {
      if (error) {
        setError(getFriendlyErrorMessage(error));
        return;
      }
      setCategories(data ?? []);
    });
    loadServices();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !categoryId || !title || !price) {
      setError('Completa título, categoría y precio antes de guardar.');
      return;
    }
    setLoading(true);
    setError('');

    const { error } = await supabase.from('services').insert({
      professional_id: user.id,
      category_id: categoryId,
      title,
      price: Number(price),
      price_unit: priceUnit,
    });

    setLoading(false);

    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }

    setTitle('');
    setPrice('');
    loadServices();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }
    loadServices();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('services').update({ is_active: !current }).eq('id', id);
    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }
    loadServices();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle>Mis servicios</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="stacked">Título del servicio</IonLabel>
            <IonInput
              value={title}
              onIonInput={(e) => setTitle(e.detail.value!)}
              placeholder="Ej. Instalación eléctrica residencial"
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Categoría</IonLabel>
            <IonSelect value={categoryId} onIonChange={(e) => setCategoryId(e.detail.value)}>
              {categories.map((c) => (
                <IonSelectOption key={c.id} value={c.id}>{c.name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Precio (Q)</IonLabel>
            <IonInput type="number" value={price} onIonInput={(e) => setPrice(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Unidad</IonLabel>
            <IonSelect value={priceUnit} onIonChange={(e) => setPriceUnit(e.detail.value)}>
              <IonSelectOption value="servicio">Por servicio</IonSelectOption>
              <IonSelectOption value="hora">Por hora</IonSelectOption>
              <IonSelectOption value="dia">Por día</IonSelectOption>
              <IonSelectOption value="m2">Por m²</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>

        {error && <IonText color="danger"><p>{error}</p></IonText>}

        <IonButton expand="block" onClick={handleAdd}>Agregar servicio</IonButton>

        <IonList className="ion-margin-top">
          {services.map((s) => (
            <IonItem key={s.id}>
              <IonLabel>
                <h2>{s.title}</h2>
                <p>Q{s.price} / {s.price_unit}</p>
              </IonLabel>
              <IonToggle
                slot="end"
                checked={s.is_active}
                onIonChange={() => handleToggleActive(s.id, s.is_active)}
              />
              <IonButton slot="end" fill="clear" color="danger" onClick={() => handleDelete(s.id)}>
                <IonIcon icon={trashOutline} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        <IonLoading isOpen={loading} message="Guardando..." />
      </IonContent>
    </IonPage>
  );
};

export default MyServices;
