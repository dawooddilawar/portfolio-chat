import React from 'react';
import Link from 'next/link';
import '@/styles/blog.css';

const blogPosts = [
    {
        title: "Understanding React Hooks",
        description: "A deep dive into React hooks and how to use them effectively.",
        link: "/blog/react-hooks"
    },
    {
        title: "Building a Portfolio with Next.js",
        description: "Step-by-step guide to creating a portfolio using Next.js.",
        link: "/blog/nextjs-portfolio"
    },
    // Add more blog posts as needed
];

const Blog: React.FC = () => {
    return (
        <div className="blog-container">
            <h2 className="text-center">Blog Posts</h2>
            <div className="blog-posts">
                {blogPosts.map((post, index) => (
                    <div key={index} className="blog-post">
                        <h3>{post.title}</h3>
                        <p>{post.description}</p>
                        <Link href={post.link} className="read-more">Read More</Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Blog; 