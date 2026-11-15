import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { useAppStore } from '../../store/useAppStore';

describe('AstroVitals UI integration', () => {
  beforeEach(async () => {
    window.location.hash = '#/';
    await useAppStore.getState().resetDemoData();
  });

  it('renders Dashboard and updates readiness/alerts when switching crew profiles', () => {
    render(<App />);
    expect(screen.getByText('Mission Health Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/VANCE-01/i)).toBeInTheDocument();

    const crewSelect = screen.getByLabelText('Active Crew Member');
    fireEvent.change(crewSelect, { target: { value: 'astro-marcus' } });

    expect(screen.getByText(/CHEN-02/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Headward Fluid Shift \+ SANS Risk/i).length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to Body Map and displays organ details when clicking an anatomical region', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /Human Body Map/i }));
    expect(screen.getByText('Interactive Astronaut Body Map')).toBeInTheDocument();

    const spineHotspot = document.querySelector('[data-region="spine"]');
    expect(spineHotspot).not.toBeNull();
    fireEvent.click(spineHotspot!);
    expect(screen.getByText('Spine & Core Posture')).toBeInTheDocument();
  });

  it('runs Check-In scenario and adapts escalation wording between ISS and Mars Base', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /Self Check-In/i }));

    fireEvent.click(screen.getByRole('button', { name: /Crisis BP 185\/122 \+ SANS/i }));
    expect(screen.getByText(/URGENT FLIGHT SURGEON CONSULT/i)).toBeInTheDocument();

    const envSelect = screen.getByLabelText('Mission Environment');
    fireEvent.change(envSelect, { target: { value: 'marsBase' } });
    expect(screen.getByText(/AUTONOMOUS PROTOCOL FIRST/i)).toBeInTheDocument();
  });

  it('unlocks Medical Officer View and creates a new astronaut profile in Crew Overview', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /Crew & Profiles/i }));
    expect(screen.getByText(/Crew Overview & Profile Console/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Unlock Medical Officer View/i }));
    expect(screen.getByRole('button', { name: /Medical Officer Mode: ON/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add Crew Profile/i }));
    fireEvent.change(screen.getByPlaceholderText('e.g. PS Maya Patel'), {
      target: { value: 'PS Maya Patel' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

    expect(screen.getAllByText(/PS Maya Patel/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches tabs in NASA HRP & CSA Learn encyclopedia', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /NASA HRP & CSA Learn/i }));
    expect(screen.getByText(/NASA HRP & Canadian Space Agency Encyclopedia/i)).toBeInTheDocument();
    expect(screen.getByText('Space Radiation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /17 HRP Risks/i }));
    expect(screen.getByText(/Spaceflight Associated Neuro-ocular Syndrome \(SANS\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Studies & CSA Tech/i }));
    expect(screen.getByText(/CSA CANS \(Canadian Active Neutron Spectrometer\)/i)).toBeInTheDocument();
  });

  it('renders Trends & Dosimetry and simulates Tempus Pro Downlink Report', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /Trends & Dosimetry/i }));
    expect(screen.getByText(/Dynamic Health Trends & Dosimetry/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Tempus Pro Downlink/i }));
    expect(screen.getByText(/Tempus Pro Telemedicine Downlink Report/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Simulate Downlink/i }));
    expect(await screen.findByText(/Downlink Queued:/i, {}, { timeout: 2500 })).toBeInTheDocument();
  });
});
