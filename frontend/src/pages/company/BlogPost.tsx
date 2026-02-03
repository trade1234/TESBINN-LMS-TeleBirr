import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "@/lib/api";
import type { ApiResponse, BlogPost } from "@/lib/types";

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!slug) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<ApiResponse<BlogPost>>(`/blog/${slug}`);
        if (!active) return;
        setPost(res.data.data);
      } catch (err: any) {
        if (!active) return;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load blog post.";
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="bg-hero py-10">
          <div className="container-wide section-padding">
            <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to blog
            </Link>
          </div>
        </section>

        <section className="py-10 lg:py-14">
          <div className="container-wide section-padding">
            {isLoading && <p className="text-sm text-muted-foreground">Loading post...</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!isLoading && !error && post && (
              <div className="max-w-3xl mx-auto space-y-6">
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full rounded-2xl object-cover"
                  />
                )}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString()
                          : "-"}
                    </span>
                    {post.category && (
                      <span className="inline-flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {post.category}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{post.title}</h1>
                  {post.excerpt && <p className="text-muted-foreground">{post.excerpt}</p>}
                </div>
                {post.content && (
                  <div className="prose prose-neutral max-w-none">
                    {post.content.split("\n").map((line, index) => (
                      <p key={`${line}-${index}`}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
