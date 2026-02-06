// src/components/MusicPlayer.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game';

// Simple procedural ambient music using Web Audio API
export function MusicPlayer() {
  const { musicEnabled, musicVolume } = useGameStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (!musicEnabled) {
      // Stop all audio
      if (audioContextRef.current && isPlayingRef.current) {
        oscillatorsRef.current.forEach(osc => {
          try {
            osc.stop();
          } catch (e) {
            // Ignore if already stopped
          }
        });
        oscillatorsRef.current = [];
        isPlayingRef.current = false;
      }
      return;
    }

    // Create or resume audio context
    const startMusic = async () => {
      if (isPlayingRef.current) return;

      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // Resume if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create master gain
      if (!gainNodeRef.current) {
        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.connect(ctx.destination);
      }
      gainNodeRef.current.gain.value = musicVolume * 0.15; // Keep it quiet

      // Create ambient pad sounds
      const notes = [
        130.81, // C3
        164.81, // E3
        196.00, // G3
        246.94, // B3
      ];

      const createPad = (freq: number, detune: number) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = detune;

        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;

        oscGain.gain.value = 0;

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(gainNodeRef.current!);

        osc.start();
        oscillatorsRef.current.push(osc);

        // Slow fade in/out pattern
        const modulateGain = () => {
          const now = ctx.currentTime;
          const duration = 4 + Math.random() * 4;

          oscGain.gain.setValueAtTime(oscGain.gain.value, now);
          oscGain.gain.linearRampToValueAtTime(0.3 + Math.random() * 0.2, now + duration / 2);
          oscGain.gain.linearRampToValueAtTime(0.05, now + duration);

          setTimeout(modulateGain, duration * 1000);
        };

        setTimeout(modulateGain, Math.random() * 2000);
      };

      // Create multiple layered pads
      notes.forEach((note, i) => {
        createPad(note, i * 3 - 4);
        createPad(note * 2, i * 2 + 5); // Octave up
      });

      // Add gentle nature-like sounds (chirps)
      const createChirp = () => {
        if (!isPlayingRef.current || !audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const chirpOsc = ctx.createOscillator();
        const chirpGain = ctx.createGain();
        const chirpFilter = ctx.createBiquadFilter();

        chirpOsc.type = 'sine';
        chirpOsc.frequency.value = 800 + Math.random() * 1200;

        chirpFilter.type = 'bandpass';
        chirpFilter.frequency.value = 1000 + Math.random() * 500;
        chirpFilter.Q.value = 5;

        chirpGain.gain.value = 0;

        chirpOsc.connect(chirpFilter);
        chirpFilter.connect(chirpGain);
        chirpGain.connect(gainNodeRef.current!);

        const now = ctx.currentTime;
        chirpGain.gain.setValueAtTime(0, now);
        chirpGain.gain.linearRampToValueAtTime(0.1 * musicVolume, now + 0.02);
        chirpGain.gain.linearRampToValueAtTime(0, now + 0.1);

        chirpOsc.frequency.setValueAtTime(chirpOsc.frequency.value, now);
        chirpOsc.frequency.linearRampToValueAtTime(chirpOsc.frequency.value * 0.8, now + 0.1);

        chirpOsc.start(now);
        chirpOsc.stop(now + 0.15);

        // Schedule next chirp
        setTimeout(createChirp, 2000 + Math.random() * 6000);
      };

      // Start chirps after a delay
      setTimeout(createChirp, 1000 + Math.random() * 3000);

      isPlayingRef.current = true;
    };

    // Start on user interaction
    const handleInteraction = () => {
      startMusic();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [musicEnabled]);

  // Update volume when it changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = musicVolume * 0.15;
    }
  }, [musicVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Ignore
        }
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
