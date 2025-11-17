import glob
import os
import uuid
from dataclasses import dataclass
from typing import Iterable, List, Sequence
import easyocr
import numpy as np
from pdf2image import convert_from_path
from pdf2image.exceptions import PDFInfoNotInstalledError
from sentence_transformers import SentenceTransformer


EMBEDDING_MODEL_NAME="paraphrase-MiniLM-L3-v2"


@dataclass
class EmbeddedChunk:
    id: str
    text: str
    embedding: np.ndarray
    metadata: dict


model = SentenceTransformer(EMBEDDING_MODEL_NAME)
reader = easyocr.Reader(["en"], gpu=False)

vector_store: List[EmbeddedChunk] = []


def split_text(text: str, chunk_size: int =800,overlap: int = 150) -> List[str]:
    words = text.split()
    if not words:
        return []

    chunks: List[str] = []
    start = 0
    while start < len(words):
        end = min(len(words), start + chunk_size)
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end == len(words):
            break
        start = max(0, end - overlap)
    return chunks


def extract_pdf(pdf_path: str) -> Iterable[str]:
    poppler_path = os.getenv("POPPLER_PATH")
    try:
        pages =convert_from_path(pdf_path, dpi=200, poppler_path=poppler_path)
    except PDFInfoNotInstalledError as exc:
        raise RuntimeError(
        ) from exc

    for page_index, page in enumerate(pages, start=1):
        page_array = np.array(page)
        segments = reader.readtext(page_array, detail=0, paragraph=True)
        joined = "\n".join(segment.strip() for segment in segments if segment and segment.strip())
        if joined:
            yield joined


def embed_texts(texts: Sequence[str]) -> np.ndarray:
    embeddings = model.encode(list(texts), batch_size=8, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.astype(np.float32)


def reset_index() -> None:
    vector_store.clear()


def add_chunks(chunks: Sequence[str], metadata: Sequence[dict]) -> None:
    if not chunks:
        return

    embeddings = embed_texts(chunks)
    for text, embedding, meta in zip(chunks, embeddings, metadata):
        vector_store.append(
            EmbeddedChunk(
                id=str(uuid.uuid4()),
                text=text,
                embedding=embedding,
                metadata=meta,
            ),
        )


def process_pdf(pdf_path: str) -> None:
    chunk_texts: List[str] = []
    chunk_meta: List[dict] = []

    for page_number, text in enumerate(extract_pdf(pdf_path), start=1):
        for chunk_number, chunk in enumerate(split_text(text), start=1):
            chunk_texts.append(chunk)
            chunk_meta.append(
                {
                    "filename": os.path.basename(pdf_path),
                    "page": page_number,
                    "chunk": chunk_number,
                },
            )

    add_chunks(chunk_texts, chunk_meta)


def process_all(folder_path: str, refresh: bool = True) -> None:
    if refresh:
        reset_index()

    pdfs = glob.glob(os.path.join(folder_path, "*.pdf"))
    for pdf_path in pdfs:
        process_pdf(pdf_path)

#similarity search
def search_similar(query: str, top_k: int = 3) -> List[dict]:
    if not vector_store:
        return []

    query_vector = embed_texts([query])[0]
    matrix = np.vstack([chunk.embedding for chunk in vector_store])
    scores = matrix @ query_vector

    top_indices = np.argsort(scores)[::-1][:top_k]

    results: List[dict] = []
    for index in top_indices:
        chunk = vector_store[index]
        results.append(
            {
                "document": chunk.text,
                "metadata": chunk.metadata,
                "score": float(scores[index]),
            },
        )

    return results
