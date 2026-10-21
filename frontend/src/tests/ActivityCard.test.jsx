import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActivityCard } from '../components/ActivityCard';

describe('ActivityCard Component', () => {
  const mockItem = {
    id: 'item-1',
    time_slot: '09:30 - 12:30',
    type: 'attraction',
    title: 'Amber Fort & Palace',
    description: 'Magnificent hilltop fortress overlooking Maota Lake.',
    location: 'Amer Road, Jaipur',
    cost: 500,
    duration_min: 180,
  };

  it('renders title, time slot, duration and estimated cost', () => {
    render(
      <ActivityCard
        item={mockItem}
        index={0}
        totalItems={3}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Amber Fort & Palace')).toBeInTheDocument();
    expect(screen.getByText('09:30 - 12:30')).toBeInTheDocument();
    expect(screen.getByText(/180 min/)).toBeInTheDocument();
    expect(screen.getByText(/Est\./)).toBeInTheDocument();
  });

  it('triggers onEdit callback when clicking edit button', () => {
    const handleEdit = vi.fn();
    render(
      <ActivityCard
        item={mockItem}
        index={0}
        totalItems={3}
        onEdit={handleEdit}
        onDelete={vi.fn()}
      />
    );

    const editBtn = screen.getByTitle('Edit Activity');
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockItem);
  });
});
