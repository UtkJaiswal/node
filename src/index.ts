import { app, PORT } from './app'


app.listen(PORT, '0.0.0.0', (): void => {
  console.log(`Server is running on port ${PORT}`);
});
