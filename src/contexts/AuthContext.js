@@ .. @@
   useEffect(() => {
     if (token) {
       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
       // Verify token validity
       verifyToken();
     } else {
       setLoading(false);
     }
-  }, [token]);
+  }, [token, verifyToken]);

-  const verifyToken = async () => {
+  const verifyToken = useCallback(async () => {
     try {
       // Make a request to verify the token
       const response = await axios.get(`${API_URL}/api/health`);
       if (response.status === 200) {
         setUser({ token });
       }
     } catch (error) {
       console.error('Token verification failed:', error);
       logout();
     } finally {
       setLoading(false);
     }
-  };
+  }, [API_URL, token]);