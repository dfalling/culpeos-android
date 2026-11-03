import {t} from '../i18n';
import {type ElementFilters, EMPTY_FILTERS} from './elementFilters';
import type {ActiveFilterPill} from './FilterChips';

// Stand-ins for a filter's kind on its pill, so the kinds read differently
// while sharing one pill style. A trip uses its own emoji.
const ICONS = {
  search: '🔍',
  label: '🏷️',
  trip: '🗺️',
  schedule: '📅',
  progress: '☑️',
  deleted: '🗑️',
};

/** One pill per active filter, each clearing only its own filter. */
export function activeFilterPills(
  filters: ElementFilters,
  onChange: (filters: ElementFilters) => void,
): ActiveFilterPill[] {
  const pills: ActiveFilterPill[] = [];
  if (filters.trip) {
    pills.push({
      key: 'trip',
      icon: filters.trip.icon || ICONS.trip,
      title: filters.trip.name,
      clearLabel: t.map.clearTripFilter,
      onClear: () => onChange({...filters, trip: null}),
    });
  }
  const search = filters.search.trim();
  if (search) {
    pills.push({
      key: 'search',
      icon: ICONS.search,
      title: search,
      clearLabel: t.filters.clearFilter(t.filters.text),
      onClear: () => onChange({...filters, search: EMPTY_FILTERS.search}),
    });
  }
  for (const label of filters.labels) {
    pills.push({
      key: `label:${label}`,
      icon: ICONS.label,
      title: label,
      clearLabel: t.map.clearLabelFilter(label),
      onClear: () =>
        onChange({...filters, labels: filters.labels.filter(l => l !== label)}),
    });
  }
  if (filters.scheduled !== 'all') {
    pills.push({
      key: 'scheduled',
      icon: ICONS.schedule,
      title:
        filters.scheduled === 'yes'
          ? t.filters.scheduled
          : t.filters.unscheduled,
      clearLabel: t.filters.clearFilter(t.filters.schedule),
      onClear: () => onChange({...filters, scheduled: 'all'}),
    });
  }
  if (filters.completed !== 'all') {
    pills.push({
      key: 'completed',
      icon: ICONS.progress,
      title: filters.completed === 'yes' ? t.filters.done : t.filters.toDo,
      clearLabel: t.filters.clearFilter(t.filters.progress),
      onClear: () => onChange({...filters, completed: 'all'}),
    });
  }
  if (filters.deleted) {
    pills.push({
      key: 'deleted',
      icon: ICONS.deleted,
      title: t.filters.deleted,
      clearLabel: t.filters.clearFilter(t.filters.deleted),
      onClear: () => onChange({...filters, deleted: false}),
    });
  }
  return pills;
}
