import { create } from 'zustand';
import { apiClient } from '../api/client';

export const useTripStore = create((set, get) => ({
  // Wizard State
  builderStep: 1,
  builderData: {
    destination: 'Jaipur',
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    groupSize: 2,
    budget: 35000,
    currency: 'INR',
    interests: ['sightseeing', 'culture', 'food'],
    travelStyle: 'balanced',
    pace: 'moderate',
    dietaryPrefs: ['vegetarian'],
    notes: '',
  },

  // Active Trip State
  currentTrip: null,
  trips: [],
  recommendations: null,
  loading: false,
  generating: false,
  error: null,
  toast: null,

  setBuilderStep: (step) => set({ builderStep: step }),

  updateBuilderData: (fields) =>
    set((state) => ({
      builderData: { ...state.builderData, ...fields },
    })),

  setToast: (toast) => {
    set({ toast });
    if (toast) {
      setTimeout(() => {
        set({ toast: null });
      }, 4000);
    }
  },

  // Fetch recommendations for step 5 / preview
  fetchRecommendations: async () => {
    const { builderData } = get();
    if (!builderData.destination) return;
    try {
      const res = await apiClient.post('/recommendations', {
        destination: builderData.destination,
        interests: builderData.interests,
        travel_style: builderData.travelStyle,
        pace: builderData.pace,
        budget_level: builderData.budget < 15000 ? 'budget' : builderData.budget < 50000 ? 'mid' : 'premium',
        dietary_prefs: builderData.dietaryPrefs,
        max_items: 6,
      });
      set({ recommendations: res.data });
      return res.data;
    } catch (err) {
      console.warn('Recommendation fetch failed:', err.message);
    }
  },

  // Generate Itinerary
  generateItinerary: async (navigate) => {
    const { builderData } = get();
    set({ generating: true, error: null });
    try {
      const payload = {
        title: `Trip to ${builderData.destination}`,
        destination: builderData.destination,
        start_date: builderData.startDate,
        end_date: builderData.endDate,
        budget: Number(builderData.budget),
        currency: 'INR',
        group_size: Number(builderData.groupSize),
        interests: builderData.interests,
        travel_style: builderData.travelStyle,
        pace: builderData.pace,
        dietary_prefs: builderData.dietaryPrefs,
        notes: builderData.notes,
        save_to_trips: true,
      };

      const res = await apiClient.post('/itineraries/generate', payload);
      set({ currentTrip: res.data, generating: false });
      get().setToast({
        type: 'success',
        message: 'Itinerary generated successfully! Explore your custom plan.',
      });
      if (navigate && res.data.id) {
        navigate(`/trips/${res.data.id}`);
      }
      return res.data;
    } catch (err) {
      set({ generating: false, error: err.message });
      get().setToast({ type: 'error', message: err.message });
      throw err;
    }
  },

  // Load Trips List
  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get('/trips');
      set({ trips: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  // Load Single Trip
  fetchTripById: async (tripId) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get(`/trips/${tripId}`);
      set({ currentTrip: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ loading: false, error: err.message });
      get().setToast({ type: 'error', message: 'Failed to load trip' });
    }
  },

  // Delete Trip
  deleteTrip: async (tripId) => {
    try {
      await apiClient.delete(`/trips/${tripId}`);
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
        currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
      }));
      get().setToast({ type: 'success', message: 'Trip deleted.' });
    } catch (err) {
      get().setToast({ type: 'error', message: err.message });
    }
  },

  // Regenerate a single day
  regenerateDay: async (tripId, dayNumber, customInstruction) => {
    set({ loading: true });
    try {
      const res = await apiClient.post(
        `/itineraries/${tripId}/days/${dayNumber}/regenerate`,
        { custom_instruction: customInstruction, preserve_existing_customizations: true }
      );
      // Update local state for this day
      set((state) => {
        if (!state.currentTrip) return state;
        const updatedDays = state.currentTrip.days.map((d) =>
          d.day_number === dayNumber ? { ...d, ...res.data } : d
        );
        return {
          currentTrip: { ...state.currentTrip, days: updatedDays },
          loading: false,
        };
      });
      get().setToast({
        type: 'success',
        message: `Day ${dayNumber} regenerated with requested tweaks.`,
      });
    } catch (err) {
      set({ loading: false });
      get().setToast({ type: 'error', message: err.message });
    }
  },

  // Update Itinerary Item
  updateItem: async (tripId, dayId, itemId, fields) => {
    try {
      const res = await apiClient.put(
        `/itineraries/${tripId}/items/${itemId}?day_id=${dayId}`,
        fields
      );
      set((state) => {
        if (!state.currentTrip) return state;
        const newDays = state.currentTrip.days.map((day) => {
          const newItems = day.items.map((item) =>
            item.id === itemId ? { ...item, ...res.data } : item
          );
          return {
            ...day,
            items: newItems,
            estimated_cost: newItems.reduce((acc, cur) => acc + (cur.cost || 0), 0),
          };
        });
        return {
          currentTrip: { ...state.currentTrip, days: newDays },
        };
      });
      get().setToast({ type: 'success', message: 'Activity updated.' });
    } catch (err) {
      get().setToast({ type: 'error', message: err.message });
    }
  },

  // Delete Itinerary Item
  deleteItem: async (tripId, itemId) => {
    try {
      await apiClient.delete(`/itineraries/${tripId}/items/${itemId}`);
      set((state) => {
        if (!state.currentTrip) return state;
        const newDays = state.currentTrip.days.map((day) => {
          const newItems = day.items.filter((item) => item.id !== itemId);
          return {
            ...day,
            items: newItems,
            estimated_cost: newItems.reduce((acc, cur) => acc + (cur.cost || 0), 0),
          };
        });
        return {
          currentTrip: { ...state.currentTrip, days: newDays },
        };
      });
      get().setToast({ type: 'success', message: 'Activity removed.' });
    } catch (err) {
      get().setToast({ type: 'error', message: err.message });
    }
  },

  // Add Itinerary Item
  addItem: async (tripId, dayNumber, itemData) => {
    try {
      const res = await apiClient.post(
        `/itineraries/${tripId}/days/${dayNumber}/items`,
        itemData
      );
      set((state) => {
        if (!state.currentTrip) return state;
        const newDays = state.currentTrip.days.map((day) => {
          if (day.day_number === dayNumber) {
            const newItems = [...day.items, res.data];
            return {
              ...day,
              items: newItems,
              estimated_cost: newItems.reduce((acc, cur) => acc + (cur.cost || 0), 0),
            };
          }
          return day;
        });
        return {
          currentTrip: { ...state.currentTrip, days: newDays },
        };
      });
      get().setToast({ type: 'success', message: 'New activity added!' });
    } catch (err) {
      get().setToast({ type: 'error', message: err.message });
    }
  },

  // Reorder items in day
  reorderItems: async (tripId, dayNumber, orderedItemIds) => {
    try {
      await apiClient.put(`/itineraries/${tripId}/days/${dayNumber}/reorder`, {
        ordered_item_ids: orderedItemIds,
      });
      set((state) => {
        if (!state.currentTrip) return state;
        const newDays = state.currentTrip.days.map((day) => {
          if (day.day_number === dayNumber) {
            const itemMap = new Map(day.items.map((i) => [i.id, i]));
            const sortedItems = orderedItemIds
              .map((id, idx) => {
                const item = itemMap.get(id);
                return item ? { ...item, order_index: idx } : null;
              })
              .filter(Boolean);
            return { ...day, items: sortedItems };
          }
          return day;
        });
        return { currentTrip: { ...state.currentTrip, days: newDays } };
      });
    } catch (err) {
      get().setToast({ type: 'error', message: err.message });
    }
  },

  // Invite Member
  inviteMember: async (tripId, email, role = 'editor') => {
    try {
      const res = await apiClient.post(`/trips/${tripId}/members`, { email, role });
      set((state) => {
        if (!state.currentTrip) return state;
        const members = state.currentTrip.members || [];
        return {
          currentTrip: {
            ...state.currentTrip,
            members: [...members, res.data],
          },
        };
      });
      get().setToast({
        type: 'success',
        message: `Invited ${email} as ${role}!`,
      });
    } catch (err) {
      get().setToast({ type: 'error', message: err.message });
    }
  },
}));
