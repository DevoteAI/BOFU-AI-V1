import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Brain, Loader2, CheckCircle } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
}

const pulseAnimation = {
  scale: [1, 1.1, 1],
  opacity: [0.8, 1, 0.8],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export function ProcessingModal({ isOpen }: ProcessingModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-secondary-900 border-2 border-primary-500/20 p-6 text-left align-middle shadow-glow transition-all">
                <div className="flex flex-col items-center justify-center gap-4">
                  <motion.div
                    className="w-16 h-16 rounded-full border-4 border-primary-500/20"
                    animate={{
                      rotate: 360,
                      borderTopColor: 'rgb(var(--color-primary-400))',
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium text-primary-400"
                  >
                    Processing Your Request
                  </Dialog.Title>
                  <p className="text-sm text-gray-400">
                    Please wait while we analyze your data...
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}