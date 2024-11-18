'use client';

import { isAfter } from 'date-fns';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { Document } from '@/db/schema';
import { getDocumentTimestampByIndex } from '@/lib/utils';

import { UIBlock } from './block';
import { LoaderIcon } from './icons';
import { Button } from '../ui/button';

interface VersionFooterProps {
  block: UIBlock;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  documents: Array<Document> | undefined;
  currentVersionIndex: number;
}

export const VersionFooter = ({
  block,
  handleVersionChange,
  documents,
  currentVersionIndex,
}: VersionFooterProps) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const { mutate } = useSWRConfig();
  const [isMutating, setIsMutating] = useState(false);

  if (!documents) return;

  return (
    <motion.div
      className="absolute flex flex-col gap-4 lg:flex-row bottom-0 bg-background p-4 w-full border-t z-50 justify-between"
      initial={{ y: isMobile ? 200 : 77 }}
      animate={{ y: 0 }}
      exit={{ y: isMobile ? 200 : 77 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
    >
      <div>
        <div>You are viewing a previous version</div>
        <div className="text-muted-foreground text-sm">
          Restore this version to make edits
        </div>
      </div>

      <div className="flex flex-row gap-4">
        <Button
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);

            mutate(
              `/api/document?id=${block.documentId}`,
              await fetch(`/api/document?id=${block.documentId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  timestamp: getDocumentTimestampByIndex(
                    documents,
                    currentVersionIndex
                  ),
                }),
              }),
              {
                optimisticData: documents
                  ? [
                      ...documents.filter((document) =>
                        isAfter(
                          new Date(document.createdAt),
                          new Date(
                            getDocumentTimestampByIndex(
                              documents,
                              currentVersionIndex
                            )
                          )
                        )
                      ),
                    ]
                  : [],
              }
            );
          }}
        >
          <div>Restore this version</div>
          {isMutating && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            handleVersionChange('latest');
          }}
        >
          Back to latest version
        </Button>
      </div>

      {/* Footer: Frase adicional */}
      <div className="mt-4 w-full text-center border-t pt-4 text-sm text-gray-500 dark:text-gray-400">
        Hecho con{' '}
        <span className="text-red-500">❤️</span> por{' '}
        <a
          href="https://linberai.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-blue-600 hover:underline"
        >
          LinberAI
        </a>{' '}
        con talento misionero{' '}
        <span role="img" aria-label="Misiones">
          🧉
        </span>
      </div>
    </motion.div>
  );
};

