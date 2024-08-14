import { app, PORT } from './app'


app.listen(PORT, (): void => {
  console.log(`Server is running on port ${PORT}`);
});
